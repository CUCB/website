import type { RequestEvent } from "./$types";
import orm from "$lib/database";
import { UPDATE_GIG_DETAILS } from "$lib/permissions";
import { Contact } from "$lib/entities/GigContact";
import { error } from "@sveltejs/kit";

const UPDATABLE_FIELDS = ["id", ""];

export const POST = async ({ request, locals }: RequestEvent): Promise<Response> => {
  if (UPDATE_GIG_DETAILS.guard(locals.session)) {
    const contactRepository = orm.em.fork().getRepository(Contact);
    const body = Object.fromEntries(
      Object.entries(await request.json()).filter(([key, _]) => UPDATABLE_FIELDS.includes(key)),
    );

    contactRepository;
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
