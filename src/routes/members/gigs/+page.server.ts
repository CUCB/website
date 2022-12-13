import { error } from "@sveltejs/kit";
import { DateTime, Settings } from "luxon";
import { get } from "svelte/store";
import type { AvailableUserInstrument, SignupGig } from "../types";
import { handleErrors, client } from "../../../graphql/client";
import { QueryMultiGigDetails } from "../../../graphql/gigs";
import orm from "../../../lib/database";
import { NOT_MUSIC_ONLY } from "../../../lib/permissions";
import { fetchAvailableInstruments, fetchSignupGigs, fetchUserNotes } from "../data";
import type { PageServerLoad } from "./$types";
import { assertLoggedIn } from "../../../client-auth";

export interface GigQueryRes {
  data: {
    cucb_gigs: Gig[];
    cucb_users_instruments: UserInstrument[];
  };
}

export interface Gig {
  id: number;
  sort_date: string;
  user: {
    first: string;
  };
  posting_time: string;
  title: string;
  type: { code: string };
}

interface UserInstrument {}

export const load: PageServerLoad = async ({ locals: { session }, parent }) => {
  Settings.defaultZoneName = "Europe/London";

  await parent();
  assertLoggedIn(session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const em = orm.em.fork();
    let res_gig: GigQueryRes,
      user_notes: string,
      signup_gigs: SignupGig[],
      signup_instruments: AvailableUserInstrument[],
      res_gig_2;
    try {
      res_gig = await get(client).query({
        query: QueryMultiGigDetails(session.hasuraRole),
        variables: {
          where: {
            _or: [{ date: { _gte: "now()" } }, { arrive_time: { _gte: "now()" } }, { finish_time: { _gte: "now()" } }],
          },
          order_by: [{ date: "asc" }, { arrive_time: "asc" }],
        },
      });
      res_gig_2 = await get(client).query({
        query: QueryMultiGigDetails(session.hasuraRole),
        variables: {
          where: {
            _or: [
              {
                date: {
                  _gte: DateTime.local().startOf("month").toISO(),
                  _lte: DateTime.local().endOf("month").toISO(),
                },
              },
              {
                arrive_time: {
                  _gte: DateTime.local().startOf("month").toISO(),
                  _lte: DateTime.local().endOf("month").toISO(),
                },
              },
              {
                finish_time: {
                  _gte: DateTime.local().startOf("month").toISO(),
                  _lte: DateTime.local().endOf("month").toISO(),
                },
              },
            ],
          },
          order_by: { date: "asc" },
        },
      });
      [signup_gigs, user_notes, signup_instruments] = await Promise.all([
        fetchSignupGigs(em, session),
        fetchUserNotes(em, session),
        fetchAvailableInstruments(em, session),
      ]);
    } catch (e) {
      return handleErrors(e, session);
    }

    if (res_gig && res_gig.data && res_gig.data.cucb_gigs) {
      let gigs = res_gig.data.cucb_gigs;
      // Sort the gigs before rendering since the database can't sort by computed field
      gigs = gigs.sort((gigA, gigB) => new Date(gigA.sort_date).getTime() - new Date(gigB.sort_date).getTime());

      let signup_dict: Record<string, SignupGig> = {};
      for (let gig of signup_gigs) {
        signup_dict[gig.id] = gig;
      }

      let currentCalendarMonth = DateTime.local().toFormat("yyyy-LL");

      return {
        gigs,
        initialSignupGigs: signup_dict,
        userInstruments: signup_instruments,
        userNotes: user_notes,
        calendarGigs: {
          [currentCalendarMonth]: res_gig_2.data.cucb_gigs.sort(
            (gigA, gigB) => new Date(gigA.sort_date).getTime() - new Date(gigB.sort_date).getTime(),
          ),
        },
        currentCalendarMonth,
      };
    } else {
      throw error(500, "Couldn't retrieve gig details");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
