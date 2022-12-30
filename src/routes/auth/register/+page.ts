import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const { optionalSession } = await parent();
  if (optionalSession.userId) {
    throw redirect(302, "/members");
  }
};
