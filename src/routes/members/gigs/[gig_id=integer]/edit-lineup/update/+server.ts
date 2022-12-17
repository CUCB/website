import { error, json } from "@sveltejs/kit";
import { wrap } from "@mikro-orm/core";
import { Boolean, Literal, Null, Record, String } from "runtypes";
import orm from "../../../../../../lib/database";
import { GigLineup } from "../../../../../../lib/entities/GigLineup";
import { SELECT_GIG_LINEUPS } from "../../../../../../lib/permissions";
// TODO ensure requestevent is always imported from ./$types, not @sveltejs/kit
import type { RequestEvent } from "./$types";
import { GigLineupInstrument } from "../../../../../../lib/entities/GigLineupInstrument";

// TODO the url for this endpoint is crap, but since actions were added, a standard json endpoint needs to be on a separate url from +page.server.ts

const addUser = Record({
  type: Literal("addUser"),
  id: String,
});

const setInstrumentApproved = Record({
  type: Literal("setInstrumentApproved"),
  id: String,
  approved: Boolean.Or(Null),
});

const setPersonApproved = Record({
  type: Literal("setPersonApproved"),
  id: String,
  approved: Boolean.Or(Null),
});

export const POST = async ({ request, locals: { session }, params: { gig_id } }: RequestEvent): Response => {
  if (SELECT_GIG_LINEUPS.guard(session)) {
    const body = await request.json();
    if (addUser.guard(body)) {
      const em = orm.em.fork();
      await em.nativeInsert(GigLineup, { user: body.id, gig: gig_id });
      const person = await em
        .findOne(
          GigLineup,
          { user: body.id, gig: gig_id },
          {
            populate: [
              "user_instruments",
              "user_instruments.user_instrument",
              "user_instruments.user_instrument.instrument",
              "user.prefs",
              "user.prefs.pref_type",
              "user.instruments",
              "user.instruments.instrument",
            ],
          },
        )
        .then((e) => e && wrap(e).toPOJO());
      return json(person);
    } else if (setInstrumentApproved.guard(body)) {
      const em = orm.em.fork();
      // TODO I didn't include gig id here initially, that was an error the tests didn't catch
      const entry = await em.findOne(GigLineupInstrument, { gig_id, user_instrument: body.id });
      if (entry) {
        entry.approved = body.approved;
        await em.persistAndFlush(entry);
        return json({ approved: entry.approved });
      } else {
        throw error(400, "Instrument not found");
      }
    } else if (setPersonApproved.guard(body)) {
      const em = orm.em.fork();
      const entry = await em.findOne(GigLineup, { gig: gig_id, user: body.id });
      if (entry) {
        entry.approved = body.approved;
        await em.persistAndFlush(entry);
        return json({ approved: entry.approved });
      } else {
        throw error(400, "Person not found");
      }
    } else {
      throw error(400, "Invalid body");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
