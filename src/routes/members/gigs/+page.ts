import { error } from "@sveltejs/kit";
import { DateTime, Settings } from "luxon";
import { get } from "svelte/store";
import { handleErrors, client, clientCurrentUser } from "../../../graphql/client";
import { QueryMultiGigDetails, QueryMultiGigSignup } from "../../../graphql/gigs";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
  Settings.defaultZoneName = "Europe/London";

  const { session } = await parent();

  let res_gig, res_signup, res_gig_2;
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
    res_signup = await get(clientCurrentUser).query({
      query: QueryMultiGigSignup,
      variables: { where: { allow_signups: { _eq: true } } },
    });
  } catch (e) {
    return handleErrors(e, session);
  }

  if (res_gig && res_gig.data && res_gig.data.cucb_gigs) {
    let gigs = res_gig.data.cucb_gigs;
    // Sort the gigs before rendering since the database can't sort by computed field
    gigs = gigs.sort((gigA, gigB) => new Date(gigA.sort_date).getTime() - new Date(gigB.sort_date).getTime());

    let signup_dict = {};
    let signups = res_signup.data.cucb_gigs;
    for (let gig of signups) {
      signup_dict[gig.id] = gig;
    }

    let currentCalendarMonth = DateTime.local().toFormat("yyyy-LL");

    return {
      gigs,
      signupGigs: signup_dict,
      userInstruments: res_signup.data.cucb_users_instruments,
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
};
