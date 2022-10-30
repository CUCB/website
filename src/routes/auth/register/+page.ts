import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const { session } = await parent();
  if (session.userId) {
    throw redirect(302, "/members");
  }
};
