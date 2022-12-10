import { error, json } from "@sveltejs/kit";
import { UPDATE_GIG_DETAILS } from "$lib/permissions";
import type { RequestEvent } from "./$types";
import orm from "$lib/database";
import { Gig } from "$lib/entities/Gig";
import { wrap } from "@mikro-orm/core";

const UPDATABLE_FIELDS = [
  "type",
  "venue_id",
  "admins_only",
  "advertise",
  "allow_signups",
  "finance_caller_paid",
  "finance_deposit_received",
  "finance_payment_received",
  "food_provided",
  "title",
  "date",
  "quote_date",
  "finance",
  "notes_admin",
  "notes_band",
  "summary",
  "arrive_time",
  "finish_time",
  "time",
];

export const POST = async ({ locals, params, request }: RequestEvent): Promise<Response> => {
  if (UPDATE_GIG_DETAILS.guard(locals.session)) {
    const body = Object.fromEntries(
      Object.entries(await request.json()).filter(([key, _]) => UPDATABLE_FIELDS.includes(key)),
    );
    body.editing_time = "now()";
    body.editing_user = locals.session.userId;

    const gigRepository = orm.em.fork().getRepository(Gig);

    await gigRepository.nativeUpdate({ id: params.gig_id }, body);
    const savedGig = await gigRepository.findOneOrFail(
      { id: params.gig_id },
      { populate: ["contacts", "contacts.contact"], orderBy: { contacts: { contact: { name: "ASC" } } } },
    );
    const gig = wrap(savedGig).toObject();
    gig.type_id = parseInt(gig.type.id);
    gig.venue_id = parseInt(gig.venue.id);
    gig.date = new Date(gig.date).toISOString().split("T")[0];
    return json(gig);
  } else {
    throw error(403, "You're not allowed to do that!");
  }
};
