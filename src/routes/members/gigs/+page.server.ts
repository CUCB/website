import { error } from "@sveltejs/kit";
import { DateTime, Settings } from "luxon";
import type { SignupGig } from "../types";
import { NOT_MUSIC_ONLY } from "$lib/permissions";
import type { PageServerLoad } from "./$types";
import { assertLoggedIn } from "../../../client-auth";
import {
  fetchAllInstrumentsForUser,
  fetchMultiGigSignup,
  fetchMultiGigSignupSummary,
  fetchMultiGigSummary,
  fetchUserNotes,
  inCurrentMonth,
  inFuture,
} from "./queries";

export const load: PageServerLoad = async ({ locals }) => {
  Settings.defaultZoneName = "Europe/London";

  const session = { ...assertLoggedIn(locals.session), save: undefined, destroy: undefined };

  if (NOT_MUSIC_ONLY.guard(session)) {
    // Sort the gigs before rendering since the database can't sort by computed field
    const [upcomingGigs, gigsInCurrentMonth, signup_gigs, user_notes, signup_instruments, signupSummary] =
      await Promise.all([
        fetchMultiGigSummary(session, inFuture),
        fetchMultiGigSummary(session, inCurrentMonth),
        fetchMultiGigSignup(session, {}),
        fetchUserNotes(session),
        fetchAllInstrumentsForUser(session),
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
        session,
      };
    } else {
      throw error(500, "Couldn't retrieve gig details");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
