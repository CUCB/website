import { assertLoggedIn } from "../../client-auth.js";
import type { PageServerLoad } from "./$types";
import { NOT_MUSIC_ONLY } from "$lib/permissions";
import { redirect } from "@sveltejs/kit";
import { fetchAllInstrumentsForUser, fetchMultiGigSignup, fetchUserNotes } from "./gigs/queries.js";

export const load: PageServerLoad = async ({ locals }) => {
  const session = { ...assertLoggedIn(locals.session), save: undefined, destroy: undefined };

  if (NOT_MUSIC_ONLY.guard(session)) {
    const [userInstruments, userNotes, gigSignups] = await Promise.all([
      fetchAllInstrumentsForUser(session),
      fetchUserNotes(session),
      fetchMultiGigSignup(session, { admins_only: false, allow_signups: true }),
    ]);

    return { gigSignups, userInstruments, userNotes, session };
  } else {
    throw redirect(302, "/members/music");
  }
};
