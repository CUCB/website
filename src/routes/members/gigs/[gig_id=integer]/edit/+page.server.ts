import { assertLoggedIn } from "../../../../../client-auth";
import { error } from "@sveltejs/kit";
import { sortContacts, sortVenues } from "./sort";
import type { PageServerLoad } from "./$types";
import { UPDATE_GIG_DETAILS } from "$lib/permissions";
import orm from "$lib/database";
import { Gig as DbGig } from "$lib/entities/Gig";
import { GigVenue as DbVenue } from "$lib/entities/GigVenue";
import { GigType as DbGigType } from "$lib/entities/GigType";
import { Contact as DbContact } from "$lib/entities/Contact";
import { EntityManager, wrap } from "@mikro-orm/core";
import { DateTime } from "luxon";
import type { Contact, Gig, Venue } from "./types";

const fetchGig = (em: EntityManager, id: string): Promise<Gig | null> =>
  em
    .fork()
    .findOne(
      DbGig,
      { id },
      {
        populate: ["contacts", "contacts.contact", "editing_user", "posting_user", "venue", "type"],
        orderBy: { contacts: { contact: { name: "ASC" } } },
      },
    )
    .then(
      (gig) =>
        gig && {
          ...wrap(gig).toObject(),
          date: gig.date && DateTime.fromJSDate(gig.date).toISODate(),
          quote_date: gig.quote_date && DateTime.fromJSDate(gig.quote_date).toISODate(),
          posting_time: gig.posting_time && DateTime.fromJSDate(gig.posting_time).toISO(),
          editing_time: gig.editing_time && DateTime.fromJSDate(gig.editing_time).toISO(),
          arrive_time: gig.arrive_time && DateTime.fromJSDate(gig.arrive_time).toISO(),
          finish_time: gig.finish_time && DateTime.fromJSDate(gig.finish_time).toISO(),
          type: gig.type.id,
          venue: gig.venue?.id,
        },
    );

const fetchAllVenues = (em: EntityManager): Promise<Venue[]> =>
  em.find(DbVenue, {}).then((e) => e.map((e) => wrap(e).toPOJO()));

const fetchAllContacts = (em: EntityManager): Promise<Contact[]> =>
  em.find(DbContact, {}).then((e) => e.map((e) => wrap(e).toPOJO()));

export const load: PageServerLoad = async ({ params, fetch, parent }) => {
  let { gig_id } = params;

  const { session: tmpSession }: { session: {} | { userId: string; firstName: string; lastName: string } } =
    await parent();
  const session = assertLoggedIn(tmpSession);

  if (UPDATE_GIG_DETAILS.guard(session)) {
    const em = (await orm()).em.fork();
    const [gig, venues, gigTypes, allContacts] = await Promise.all([
      fetchGig(em, gig_id),
      fetchAllVenues(em),
      em.find(DbGigType, {}).then((e) => e.map((e) => wrap(e).toPOJO())),
      fetchAllContacts(em),
    ]);
    if (gig) {
      sortVenues(venues);
      sortContacts(gig.contacts);
      sortContacts(allContacts);
      return {
        ...gig,
        lastSaved: gig,
        venues,
        gigTypes,
        allContacts,
        session,
      };
    } else {
      throw error(404, "Gig not found");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
