import { error, json } from "@sveltejs/kit";
import { wrap } from "@mikro-orm/core";
import { Literal, Record, String } from "runtypes";
import orm from "../../../../../../lib/database";
import { GigLineup } from "../../../../../../lib/entities/GigLineup";
import { SELECT_GIG_LINEUPS } from "../../../../../../lib/permissions";
// TODO ensure requestevent is always imported from ./$types, not @sveltejs/kit
import type { RequestEvent } from "./$types";

// TODO the url for this endpoint is crap, but since actions were added, a standard json endpoint needs to be on a separate url from +page.server.ts

const addUser = Record({
  type: Literal("addUser"),
  id: String,
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
    } else {
      throw error(400, "Invalid body");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
