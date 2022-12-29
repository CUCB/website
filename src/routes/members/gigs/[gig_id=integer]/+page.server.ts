import { assertLoggedIn } from "../../../../client-auth";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { NOT_MUSIC_ONLY } from "$lib/permissions";
import {
  fetchAllInstrumentsForUser,
  fetchSpecificGigSignup,
  fetchSpecificGigSignupSummary,
  fetchSpecificGigSummary,
} from "../queries";

export const load: PageServerLoad = async ({ params: { gig_id }, locals }) => {
  const session = assertLoggedIn(locals.session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const [gig, signupGig, userInstruments, signupSummary] = await Promise.all([
      fetchSpecificGigSummary(session, gig_id),
      fetchSpecificGigSignup(session, gig_id),
      fetchAllInstrumentsForUser(session),
      fetchSpecificGigSignupSummary(session, gig_id),
    ]);

    if (gig) {
      return {
        gig,
        signupGig,
        userInstruments,
        signupSummary: (gig && gig.allow_signups && signupSummary) || null,
        session: { ...session, save: undefined, destroy: undefined },
      };
    } else {
      throw error(404, "Gig not found");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
