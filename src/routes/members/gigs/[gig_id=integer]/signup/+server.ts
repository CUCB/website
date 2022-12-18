import { Record, Boolean, String, Array, Null } from "runtypes";
import { assertLoggedIn } from "../../../../../client-auth";
import orm from "$lib/database";
import type { RequestEvent } from "./$types";
import { GigLineup } from "$lib/entities/GigLineup";
import { NOT_MUSIC_ONLY, VIEW_HIDDEN_GIGS } from "$lib/permissions";
import { error, json } from "@sveltejs/kit";
import { GigLineupInstrument } from "$lib/entities/GigLineupInstrument";
import { User } from "$lib/entities/User";
import { Gig } from "$lib/entities/Gig";

const SIGNUP_REQUEST = Record({
  user_available: Boolean,
  user_only_if_necessary: Boolean,
});

const UPDATE_INSTRUMENTS = Record({
  insert: Array(Record({ id: String })),
  delete: Array(Record({ id: String })),
});

const UPDATE_NOTES = Record({
  gig_notes: String.Or(Null),
  gig_id: String,
  other_notes: String,
});

export const POST = async ({ locals: { session }, params: { gig_id }, request }: RequestEvent): Promise<Response> => {
  assertLoggedIn(session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const em = orm.em.fork();
    const gig = await em.findOneOrFail(Gig, { id: gig_id });
    if (gig) {
      if (!gig.allow_signups) {
        throw error(403, "Signups are not open for this gig");
      } else if (gig.admins_only && !VIEW_HIDDEN_GIGS.guard(session)) {
        throw error(404, "Gig not found");
      }
    }

    const body = await request.json();
    if (SIGNUP_REQUEST.guard(body)) {
      await em.upsert(GigLineup, {
        user: session.userId,
        gig: gig_id,
        user_available: body.user_available,
        user_only_if_necessary: body.user_only_if_necessary,
      });
      const entry = await em.findOneOrFail(
        GigLineup,
        { user: session.userId, gig: gig_id },
        { fields: ["user_available", "user_only_if_necessary", "user.gig_notes", "user_notes"], populate: ["user"] },
      );
      return json(entry);
    } else if (UPDATE_INSTRUMENTS.guard(body)) {
      // TODO ensure users cannot delete instruments that are approved
      const gig_lineup = await em.findOne(GigLineup, { user: session.userId, gig: gig_id });
      if (gig_lineup) {
        // TODO this doesn't seem to work???
        const inserts = (insert: { id: string }) => ({
          gig_id,
          user_id: session.userId,
          user_instrument: insert.id,
        });
        const deletes = (del: { id: string }) => ({
          gig_id,
          user_id: session.userId,
          user_instrument: del.id,
        });
        await Promise.all([
          em.upsertMany(GigLineupInstrument, body.insert.map(inserts)),
          ...body.delete.map((del) => em.nativeDelete(GigLineupInstrument, deletes(del))),
        ]);

        return json({ inserted: body.insert, deleted: body.delete });
      } else {
        throw error(400, "Not signed up to gig");
      }
    } else if (UPDATE_NOTES.guard(body)) {
      const lineup_entry = await em.findOne(
        GigLineup,
        { gig: gig_id, user: session.userId },
        { fields: ["user_notes"] },
      );
      if (lineup_entry) {
        lineup_entry.user_notes = body.gig_notes ?? undefined;
        await em.nativeUpdate(User, { id: session.userId }, { gig_notes: body.other_notes });
        await em.persistAndFlush(lineup_entry);
        return json({ user: { gig_notes: body.other_notes }, user_notes: lineup_entry.user_notes });
      } else {
        throw error(400, "Not signed up to gig");
      }
    } else {
      throw error(400, "Invalid body");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
