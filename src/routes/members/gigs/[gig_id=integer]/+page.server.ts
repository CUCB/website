import { assertLoggedIn } from "../../../../client-auth";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { NOT_MUSIC_ONLY } from "../../../../lib/permissions";
import {
  fetchAllInstrumentsForUser,
  fetchSpecificGigSignup,
  fetchSpecificGigSignupSummary,
  fetchSpecificGigSummary,
} from "../queries";

// TODO refine me a bit
interface Props {
  gig: { title: string; arrive_time?: Date; finish_time?: Date };
  signupGig: any;
  userInstruments: unknown[];
  signupSummary: SignupSummary | null;
}

type SignupSummary = {
  user: {
    first: string;
    last: string;
  };
  user_available?: boolean | null;
  user_only_if_necessary?: boolean | null;
}[];

export const load: PageServerLoad = async ({ params: { gig_id }, parent }): Promise<Props> => {
  const { session } = await parent();
  assertLoggedIn(session);

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
        signupSummary: gig && gig.allow_signups && signupSummary,
      };
    } else {
      throw error(404, "Gig not found");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
