import { error } from "@sveltejs/kit";
import { DateTime, Settings } from "luxon";
import type { SignupGig } from "../types";
import orm from "$lib/database";
import { NOT_MUSIC_ONLY } from "$lib/permissions";
import { fetchAvailableInstruments, fetchSignupGigs, fetchUserNotes } from "../data";
import type { PageServerLoad } from "./$types";
import { assertLoggedIn } from "../../../client-auth";
import { fetchMultiGigSignupSummary, fetchMultiGigSummary, inCurrentMonth, inFuture } from "./queries";

export const load: PageServerLoad = async ({ locals: { session }, parent }) => {
  Settings.defaultZoneName = "Europe/London";

  await parent();
  assertLoggedIn(session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const em = orm.em.fork();
    // Sort the gigs before rendering since the database can't sort by computed field
    const [upcomingGigs, gigsInCurrentMonth, signup_gigs, user_notes, signup_instruments, signupSummary] =
      await Promise.all([
        fetchMultiGigSummary(session, inFuture),
        fetchMultiGigSummary(session, inCurrentMonth),
        fetchSignupGigs(em, session),
        fetchUserNotes(em, session),
        fetchAvailableInstruments(em, session),
        fetchMultiGigSignupSummary(session, { gig: { allow_signups: true } }),
      ]);

    if (upcomingGigs) {
      let signup_dict: Record<string, SignupGig> = {};
      for (let gig of signup_gigs) {
        signup_dict[gig.id] = gig;
      }

      let currentCalendarMonth = DateTime.local().toFormat("yyyy-LL");

      return {
        gigs: upcomingGigs,
        signups: signupSummary,
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
