import { assertLoggedIn } from "../../client-auth";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch, parent }) => {
  const { session } = await parent();
  assertLoggedIn(session);
};
