import type { PageServerLoad } from "./$types";
import orm from "$lib/database";
import { assertLoggedIn } from "../../../../../client-auth";
import { Contact } from "$lib/entities/Contact";
import { QueryOrder, wrap } from "@mikro-orm/core";
import { error } from "@sveltejs/kit";
import { GigContact } from "$lib/entities/GigContact";
import { VIEW_HIDDEN_GIGS, VIEW_GIG_CONTACT_DETAILS } from "$lib/permissions";

export const load: PageServerLoad = async ({ locals, params: { contact_id } }) => {
  const session = assertLoggedIn(locals.session);
  const em = (await orm()).em.fork();
  const nonAdminFilter = VIEW_GIG_CONTACT_DETAILS.guard(session) ? {} : { caller: true };
  const adminFields = VIEW_GIG_CONTACT_DETAILS.guard(session) ? (["email", "notes"] as const) : [];
  const contact = await em
    .findOne(
      Contact,
      { id: contact_id, ...nonAdminFilter },
      {
        fields: ["user.id", "caller", "name", "organization", ...adminFields],
      },
    )
    .then((res) => wrap(res).toPOJO());
  if (contact) {
    const bookedGigs = VIEW_GIG_CONTACT_DETAILS.guard(session)
      ? await em
          .find(
            GigContact,
            { contact: contact_id, client: true },
            {
              fields: ["gig.id", "gig.title", "gig.date", "gig.arrive_time", "gig.venue.name", "gig.venue.subvenue"],
              populate: ["gig", "gig.venue"],
              orderBy: { gig: { date: QueryOrder.DESC } },
            },
          )
          .then((res) => res.map((res) => wrap(res).toPOJO().gig))
      : [];
    const calledGigs = await em
      .find(
        GigContact,
        {
          contact: contact_id,
          calling: true,
          ...(VIEW_HIDDEN_GIGS.guard(session) ? {} : { gig: { admins_only: false } }),
        },
        {
          fields: ["gig.id", "gig.title", "gig.date", "gig.arrive_time", "gig.venue.name", "gig.venue.subvenue"],
          populate: ["gig", "gig.venue"],
          orderBy: { gig: { date: QueryOrder.DESC } },
        },
      )
      .then((res) => res.map((res) => wrap(res).toPOJO().gig));

    const allContacts = await em
      .find(Contact, nonAdminFilter, {
        fields: ["caller", "name", "organization", ...adminFields],
      })
      .then((contacts) => contacts.map((res) => wrap(res).toPOJO()));

    return {
      contact,
      bookedGigs,
      calledGigs,
      session: { ...session, save: undefined, destroy: undefined },
      allContacts,
    };
  } else {
    throw error(404, "Contact not found");
  }
};
