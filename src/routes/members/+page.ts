import { handleErrors, clientCurrentUser } from "../../graphql/client";
import { QueryGigSignup } from "../../graphql/gigs";
import { assertLoggedIn } from "../../client-auth.js";
import type { PageLoad } from "./$types";
import { get } from "svelte/store";

export const load: PageLoad = async ({ parent, fetch, cookies }) => {
  const { session } = await parent();
  assertLoggedIn(session);

  let res;
  try {
    res = await get(clientCurrentUser).query({ query: QueryGigSignup });
  } catch (e) {
    console.error(e);
    handleErrors(e);
  }
  let gigSignups = res.data.cucb_gigs;
  let userInstruments = res.data.cucb_users_instruments;
  return { gigSignups, userInstruments };
};
