import { GraphQLClient, handleErrors } from "../../graphql/client";
import { QueryGigSignup } from "../../graphql/gigs";
import { assertLoggedIn } from "../../client-auth.js";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, fetch, cookies }) => {
  const { session } = await parent();
  assertLoggedIn(session);

  const client = new GraphQLClient(fetch, {
    role: "current_user",
  });
  let res;
  try {
    res = await client.query({ query: QueryGigSignup });
  } catch (e) {
    handleErrors(e);
  }
  let gigSignups = res.data.cucb_gigs;
  let userInstruments = res.data.cucb_users_instruments;
  return { gigSignups, userInstruments };
};
