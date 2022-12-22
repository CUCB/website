import type { RequestEvent } from "./$types";
import orm from "$lib/database";
import { UPDATE_GIG_DETAILS } from "$lib/permissions";
import { GigContact } from "$lib/entities/GigContact";
import { error, json } from "@sveltejs/kit";
import { Record, String } from "runtypes";

const UPDATABLE_FIELDS: (keyof GigContact)[] = ["calling", "client", "contact", "notes"];
const REQUIRED_FIELDS = Record({ contact: String });

export const POST = async ({ request, locals, params }: RequestEvent): Promise<Response> => {
  if (UPDATE_GIG_DETAILS.guard(locals.session)) {
    const em = (await orm()).em.fork();
    const body = Object.fromEntries(
      Object.entries(await request.json()).filter(([key, _]) => (UPDATABLE_FIELDS as string[]).includes(key)),
    );

    if (REQUIRED_FIELDS.guard(body)) {
      let gigContact = await em.upsert(GigContact, { ...body, gig: params.gig_id });
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

export const DELETE = async ({ request, locals, params }: RequestEvent): Promise<Response> => {
  if (UPDATE_GIG_DETAILS.guard(locals.session)) {
    const em = (await orm()).em.fork();
    const body = Object.fromEntries(Object.entries(await request.json()).filter(([key, _]) => key == "contact"));

    if (REQUIRED_FIELDS.guard(body)) {
      await em.nativeDelete(GigContact, { ...body, gig: params.gig_id });
      return new Response("");
    } else {
      throw error(400, "Missing gig or contact id");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
