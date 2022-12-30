import { redirect } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../client-auth";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const { optionalSession } = await parent();
  const session = assertLoggedIn(optionalSession);

  throw redirect(302, `/members/users/${session.userId}`);
};
