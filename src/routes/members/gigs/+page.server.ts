import { error } from "@sveltejs/kit";
import { DateTime, Settings } from "luxon";
import type { AvailableUserInstrument, SignupGig } from "../types";
import orm from "$lib/database";
import { NOT_MUSIC_ONLY } from "$lib/permissions";
import { fetchAvailableInstruments, fetchSignupGigs, fetchUserNotes } from "../data";
import type { PageServerLoad } from "./$types";
import { assertLoggedIn } from "../../../client-auth";
import { fetchMultiGigSummary } from "./queries";
import type { ObjectQuery } from "@mikro-orm/core";
import type { OperatorMap } from "@mikro-orm/core/typings";
import type { Gig as DbGig } from "$lib/entities/Gig";
import { writable } from "svelte/store";

export interface GigQueryRes {
  data: {
    cucb_gigs: Gig[];
    cucb_users_instruments: UserInstrument[];
  };
}

export interface Gig {
  id: number;
  sort_date: Date;
  user: {
    first: string;
  };
  posting_time: string;
  title: string;
  type: { code: string };
}

interface UserInstrument {}

const filterAnyGigDate = (filter: OperatorMap<Date>): ObjectQuery<DbGig> => ({
  $or: [{ date: filter }, { arrive_time: filter }, { finish_time: filter }],
});

const bySortDate = (gigA: Gig, gigB: Gig): number => gigA.sort_date.getTime() - gigB.sort_date.getTime();

export const load: PageServerLoad = async ({ locals: { session }, parent }) => {
  Settings.defaultZoneName = "Europe/London";

  await parent();
  assertLoggedIn(session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const em = orm.em.fork();
    // Sort the gigs before rendering since the database can't sort by computed field
    const upcomingGigs = await fetchMultiGigSummary(session, filterAnyGigDate({ $gte: "now()" })).then((gigs) =>
      gigs.sort(bySortDate),
    );
    const gigsInCurrentMonth = await fetchMultiGigSummary(
      session,
      filterAnyGigDate({
        $gte: DateTime.local().startOf("month").toISO(),
        $lte: DateTime.local().endOf("month").toISO(),
      }),
    ).then((gigs) => gigs.sort(bySortDate));
    const [signup_gigs, user_notes, signup_instruments]: [SignupGig[], string, AvailableUserInstrument[]] =
      await Promise.all([
        fetchSignupGigs(em, session),
        fetchUserNotes(em, session),
        fetchAvailableInstruments(em, session),
      ]);

    if (upcomingGigs) {
      let signup_dict: Record<string, SignupGig> = {};
      for (let gig of signup_gigs) {
        signup_dict[gig.id] = gig;
      }

      let currentCalendarMonth = DateTime.local().toFormat("yyyy-LL");

      return {
        gigs: upcomingGigs,
        initialSignupGigs: signup_dict,
        userInstruments: signup_instruments,
        userNotes: user_notes,
        calendarGigs: {
          [currentCalendarMonth]: gigsInCurrentMonth,
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
