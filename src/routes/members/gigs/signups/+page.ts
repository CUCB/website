import { handleErrors, makeClient } from "../../../../graphql/client";
import { assertLoggedIn } from "../../../../client-auth.js";
import { QueryAllGigSignupSummary } from "../../../../graphql/gigs";
import { DateTime, Settings } from "luxon";
import type { Gig } from "./types";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
  Settings.defaultZoneName = "Europe/London";

  const { session } = await parent();
  assertLoggedIn(session);

  let client = makeClient(fetch);

  let res: { data: { since: { gig: Gig }[]; signupsOpen: Gig[] } };
  try {
    res = await client.query({
      query: QueryAllGigSignupSummary,
      variables: { since: DateTime.local().minus({ months: 1 }) },
    });
  } catch (e) {
    return handleErrors(e, session);
  }

  return {
    sinceOneMonth: res.data.since.map((x) => x.gig),
    signupsOpen: res.data.signupsOpen,
  };
};
