import type { RequestEvent } from "./$types";
import orm from "$lib/database";
import { UPDATE_GIG_DETAILS } from "$lib/permissions";
import { Contact } from "$lib/entities/Contact";
import { error, json } from "@sveltejs/kit";

// TODO user cannot currently be selected, how does the existing site work here?
const UPDATABLE_FIELDS: (keyof Contact)[] = ["id", "caller", "email", "name", "notes", "organization"];

export const POST = async ({ request, locals }: RequestEvent): Promise<Response> => {
  if (UPDATE_GIG_DETAILS.guard(locals.session)) {
    const em = orm.em.fork();
    const body = Object.fromEntries(
      Object.entries(await request.json()).filter(([key, _]) => UPDATABLE_FIELDS.includes(key as keyof Contact)),
    );

    let contact;
    if (body.id) {
      contact = await em.upsert(Contact, body);
    } else {
      // @ts-ignore
      contact = em.create(Contact, body);
      await em.persistAndFlush(contact);
    }
    return json(contact);
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
