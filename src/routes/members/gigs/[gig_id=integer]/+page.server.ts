import { assertLoggedIn } from "../../../../client-auth";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import orm from "../../../../lib/database";
import { NOT_MUSIC_ONLY, VIEW_SIGNUP_SUMMARY } from "../../../../lib/permissions";
import { GigLineup } from "../../../../lib/entities/GigLineup";
import { PopulateHint, wrap, type EntityDTO, type EntityField, type Loaded, type ObjectQuery } from "@mikro-orm/core";
import { UserInstrument } from "../../../../lib/entities/UsersInstrument";
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

const signupSummaryFields: EntityField<GigLineup, string>[] = [
  { user: ["first", "last"] },
  "user_available",
  "user_only_if_necessary",
];

export const load: PageServerLoad = async ({ params: { gig_id }, parent }): Promise<Props> => {
  const { session } = await parent();
  assertLoggedIn(session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const gig = await fetchSpecificGigSummary(session, gig_id);
    const signupGig = await fetchSpecificGigSignup(session, gig_id);
    const signupSummary = gig && gig.allow_signups && (await fetchSpecificGigSignupSummary(session, gig_id));
    const userInstruments = await fetchAllInstrumentsForUser(session);

    if (gig) {
      return {
        gig,
        signupGig,
        userInstruments,
        signupSummary,
      };
    } else {
      throw error(404, "Gig not found");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
