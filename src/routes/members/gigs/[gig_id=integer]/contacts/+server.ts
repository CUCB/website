import type { RequestEvent } from "./$types";
import orm from "$lib/database";
import { UPDATE_GIG_DETAILS } from "$lib/permissions";
import { GigContact } from "$lib/entities/GigContact";
import { error, json } from "@sveltejs/kit";
import { Record, String } from "runtypes";

const UPDATABLE_FIELDS: (keyof GigContact)[] = ["gig", "calling", "client", "contact", "notes"];
const REQUIRED_FIELDS = Record({ gig: String, contact: String });

export const POST = async ({ request, locals }: RequestEvent): Promise<Response> => {
  if (UPDATE_GIG_DETAILS.guard(locals.session)) {
    const em = orm.em.fork();
    const body = Object.fromEntries(
      Object.entries(await request.json()).filter(([key, _]) => (UPDATABLE_FIELDS as string[]).includes(key)),
    );

    if (REQUIRED_FIELDS.guard(body)) {
      let gigContact = await em.upsert(GigContact, body);
      gigContact = await em.findOneOrFail(
        GigContact,
        { gig: gigContact.gig, contact: gigContact.contact },
        { populate: ["contact"] },
      );
      return json(gigContact);
    } else {
      throw error(400, "Missing gig or contact id");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
