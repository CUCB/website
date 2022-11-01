import { redirect } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../client-auth";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const { session } = await parent();
  assertLoggedIn(session);

  throw redirect(302, `/members/user/${session.userId}`);
};
