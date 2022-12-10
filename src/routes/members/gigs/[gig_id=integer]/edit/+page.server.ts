import { assertLoggedIn } from "../../../../../client-auth";
import { error } from "@sveltejs/kit";
import { sortContacts, sortVenues } from "./sort";
import type { PageServerLoad } from "./$types";
import { UPDATE_GIG_DETAILS } from "../../../../../lib/permissions";
import orm from "$lib/database";
import { Gig as DbGig } from "$lib/entities/Gig";
import { GigVenue as DbVenue } from "$lib/entities/GigVenue";
import { GigType as DbGigType } from "$lib/entities/GigType";
import { Contact as DbContact } from "$lib/entities/Contact";
import { wrap } from "@mikro-orm/core";
import { DateTime } from "luxon";

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
  let { gig_id } = params;

  const { session } = locals;
  assertLoggedIn(session);

  if (UPDATE_GIG_DETAILS.guard(session)) {
    const em = orm.em.fork();
    const fetchers = [
      em
        .findOne(
          DbGig,
          { id: gig_id },
          { populate: ["contacts", "contacts.contact"], orderBy: { contacts: { contact: { name: "ASC" } } } },
        )
        .then((e) => wrap(e).toObject()),
      em.find(DbVenue, {}).then((e) => e.map((e) => wrap(e).toPOJO())),
      em.find(DbGigType, {}).then((e) => e.map((e) => wrap(e).toPOJO())),
      em.find(DbContact, {}).then((e) => e.map((e) => wrap(e).toPOJO())),
    ];
    const [gig, venues, gigTypes, allContacts] = await Promise.all(fetchers);
    if (gig) {
      gig.date = new Date(gig.date).toISOString().split("T")[0];
      gig.arrive_time = DateTime.fromJSDate(gig.arrive_time).toISO();
      gig.finish_time = DateTime.fromJSDate(gig.finish_time).toISO();
      sortVenues(venues);
      sortContacts(gig.contacts);
      return {
        ...gig,
        lastSaved: gig,
        venues,
        gigTypes,
        allContacts,
      };
    } else {
      throw error(404, "Gig not found");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
