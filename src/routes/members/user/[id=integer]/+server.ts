import { UPDATE_ADMIN_STATUS, UPDATE_BIO } from "$lib/permissions";
import { error, json } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../../client-auth";
import { User } from "$lib/entities/User";
import type { RequestEvent } from "./$types";
import orm from "../../../../lib/database";

const UPDATABLE_FIELDS = (id: string, session: App.Locals["session"]): (keyof User)[] => {
  const fields: (keyof User)[] = [
    "dietaries",
    "email",
    "first",
    "last",
    "locationInfo",
    "mobileContactInfo",
    "saltedPassword",
    "username",
    "bio",
    "gigNotes",
  ];
  if (UPDATE_ADMIN_STATUS(id).guard(session)) {
    fields.push("adminType");
  }
  return fields;
};

export const POST = async ({ locals, params, request }: RequestEvent): Promise<Response> => {
  const { session } = locals;
  assertLoggedIn(session);

  const { id } = params;

  if (UPDATE_BIO(id).guard(session)) {
    const updatableFields = UPDATABLE_FIELDS(id, session);
    const body = Object.fromEntries(
      Object.entries(await request.json()).filter(([key, _]) => updatableFields.includes(key as keyof User)),
    );
    if (body.bio) {
      body.bioChangedDate = "now()";
    }

    const em = orm.em.fork();
    await em.nativeUpdate(User, { id }, body);
    const user = await em.findOneOrFail(User, { id });

    return json(user);
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
