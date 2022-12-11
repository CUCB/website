import { error, json } from "@sveltejs/kit";
import { Array, Boolean, String, Record } from "runtypes";
import type { Static } from "runtypes";
import orm from "../../../../../lib/database";
import { UserPref } from "../../../../../lib/entities/UserPref";
import { UPDATE_BIO } from "../../../../../lib/permissions";
import type { RequestEvent } from "./$types";

const PREF = Record({ pref_id: String, value: Boolean });
const UPDATE_PREFS = Array(PREF);

export const POST = async ({ params: { id }, request, locals: { session } }: RequestEvent): Promise<Response> => {
  if (UPDATE_BIO(id).guard(session)) {
    let body = await request.json();

    if (UPDATE_PREFS.guard(body)) {
      const em = orm.em.fork();
      await Promise.all(
        body.map((pref) => em.upsert(UserPref, { user: id, pref_type: pref.pref_id, value: pref.value })),
      );

      return json(null);
    } else {
      throw error(400, "Invalid body");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
