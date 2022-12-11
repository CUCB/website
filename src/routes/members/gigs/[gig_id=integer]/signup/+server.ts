import { Record, Boolean } from "runtypes";
import { assertLoggedIn } from "../../../../../client-auth";
import orm from "$lib/database";
import type { RequestEvent } from "./$types";
import { GigLineup } from "$lib/entities/GigLineup";
import { NOT_MUSIC_ONLY } from "$lib/permissions";
import { error, json } from "@sveltejs/kit";

const SIGNUP_REQUEST = Record({
  user_available: Boolean,
  user_only_if_necessary: Boolean,
});

export const POST = async ({ locals: { session }, params: { gig_id }, request }: RequestEvent): Promise<Response> => {
  assertLoggedIn(session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const body = await request.json();
    if (SIGNUP_REQUEST.guard(body)) {
      const em = orm.em.fork();
      await em.upsert(GigLineup, {
        user: session.userId,
        gig: gig_id,
        user_available: body.user_available,
        user_only_if_necessary: body.user_only_if_necessary,
      });
      const entry = await em.findOneOrFail(
        GigLineup,
        { user: session.userId, gig: gig_id },
        { fields: ["user_available", "user_only_if_necessary", "user.gigNotes", "user_notes"], populate: ["user"] },
      );
      // TODO remove when Signup.svelte is fully migrated
      entry.user.gig_notes = entry.user.gigNotes;
      return json(entry);
    } else {
      throw error(400, "Invalid body");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
