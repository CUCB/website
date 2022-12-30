import { assertLoggedIn } from "../../client-auth";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch, parent }) => {
  const { optionalSession } = await parent();
  assertLoggedIn(optionalSession);
};
