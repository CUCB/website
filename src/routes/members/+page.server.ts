import { assertLoggedIn } from "../../client-auth.js";
import type { PageServerLoad } from "./$types";
import { NOT_MUSIC_ONLY } from "../../lib/permissions";
import { redirect } from "@sveltejs/kit";
import orm from "../../lib/database";
import { fetchAvailableInstruments, fetchSignupGigs, fetchUserNotes } from "./data";

export const load: PageServerLoad = async ({ parent }) => {
  const { session } = await parent();
  assertLoggedIn(session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const em = orm.em.fork();
    const [userInstruments, userNotes, gigSignups] = await Promise.all([
      fetchAvailableInstruments(em, session),
      fetchUserNotes(em, session),
      fetchSignupGigs(em, session),
    ]);

    return { gigSignups, userInstruments, userNotes };
  } else {
    throw redirect(302, "/members/music");
  }
};
