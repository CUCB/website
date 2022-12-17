import { QueryGigDetails, QuerySingleGig, QuerySingleGigSignupSummary } from "../../../../graphql/gigs";
import { assertLoggedIn } from "../../../../client-auth";
import { handleErrors, client, clientCurrentUser } from "../../../../graphql/client";
import { get, writable } from "svelte/store";
import type { Writable } from "svelte/store";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

// TODO refine me a bit
interface Props {
  gig: { title: string };
  signupGig: Writable<any>;
  userInstruments: object;
  signupSummary: SignupSummary;
}

type SignupSummary = {
  user: {
    first: string;
    last: string;
  };
  user_available: boolean;
  user_only_if_necessary: boolean;
}[];

interface QuerySignupSummary {
  cucb_gigs_lineups: SignupSummary;
}

export const load: PageServerLoad = async ({ params: { gig_id }, parent }): Promise<Props> => {
  const { session } = await parent();
  assertLoggedIn(session);

  let res_gig,
    res_signup,
    signupSummary = undefined;
  let gig;
  try {
    res_gig = await get(client).query({
      query: QueryGigDetails(session.hasuraRole),
      variables: { gig_id },
    });
    res_signup = await get(clientCurrentUser).query({
      query: QuerySingleGig,
      variables: { gig_id },
    });
  } catch (e) {
    return handleErrors(e, session);
  }

  try {
    signupSummary = (
      await get(client).query<QuerySignupSummary>({
        query: QuerySingleGigSignupSummary,
        variables: { gig_id },
      })
    ).data.cucb_gigs_lineups;
  } catch (e) {
    console.error(e);
  }

  if (res_gig?.data?.cucb_gigs_by_pk) {
    gig = res_gig.data.cucb_gigs_by_pk;
  } else {
    throw error(404, "Gig not found");
  }

  return {
    gig,
    signupGig: res_signup.data.cucb_gigs?.[0],
    userInstruments: res_signup.data.cucb_users_instruments,
    signupSummary,
  };
};
