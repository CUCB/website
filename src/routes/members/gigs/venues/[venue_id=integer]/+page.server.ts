import { error } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../../../client-auth";
import { NOT_MUSIC_ONLY } from "$lib/permissions";
import type { PageServerLoad } from "./$types";
import orm from "$lib/database";
import { GigVenue } from "$lib/entities/GigVenue";
import { wrap } from "@mikro-orm/core";
import { Gig, sortDate } from "../../../../../lib/entities/Gig";
import { List } from "immutable";
import type { EntityManager } from "@mikro-orm/postgresql";

const byCountDescending = ([id, _a]: [number, unknown], [idB, _]: [number, unknown]): number => idB - id;
const tuple = <T, U>(a: T, b: U): [T, U] => [a, b];

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = assertLoggedIn(locals.session);
  if (NOT_MUSIC_ONLY.guard(session)) {
    const em = (await orm()).em.fork() as EntityManager;
    const dbVenue = await em.findOne(
      GigVenue,
      { id: params.venue_id },
      {
        populate: [
          "gigs",
          "gigs.type.code",
          "gigs.lineup.user.first",
          "gigs.lineup.user.last",
          "gigs.contacts.contact.user.id",
        ],
      },
    );
    if (dbVenue) {
      const sortedGigs = dbVenue.gigs
        .toArray()
        .sort((gigA, gigB) => sortDate(gigB).getTime() - sortDate(gigA).getTime())
        .map((gig) => ({
          ...gig,
          lineup: gig.lineup.filter((p) => p.approved),
          contacts: gig.contacts
            .filter((c) => c.calling)
            .map((c) => ({ contact: { id: c.contact.id, user: c.contact.user, name: c.contact.name }, calling: true })),
        }));
      // @ts-ignore
      const venue_ = wrap(dbVenue).toPOJO() as GigVenue;
      const venue = { ...venue_, gigs: sortedGigs };
      const subvenues = await em
        .find(GigVenue, { name: venue.name }, { fields: ["name", "subvenue", "id"] })
        .then((res) => res.map((r) => wrap(r).toPOJO()));
      const lineupPeople = List(sortedGigs.flatMap((gig) => gig.lineup).map((entry) => entry.user))
        .groupBy((user) => user.id)
        .mapEntries(([id, users]) => [id, { ...users.get(0), count: users.count() }])
        .mapEntries(([id, user]) => [id, { id, first: user.first, last: user.last, count: user.count }])
        .valueSeq()
        .sortBy((user) => `${user.first} ${user.last}`)
        .groupBy((user) => user.count)
        .toArray()
        .map(([count, user]) =>
          tuple(count, user.toJS() as [{ first: string; last: string; count: number; id: string }]),
        )
        .sort(byCountDescending);
      const contacts = List(sortedGigs.flatMap((gig) => gig.contacts).map((contact) => contact.contact))
        .groupBy((contact) => contact.id)
        .mapEntries(([id, contacts]) => [id, { ...contacts.get(0), count: contacts.count() }])
        .mapEntries(([id, contact]) => [
          id,
          { id, name: contact.name, count: contact.count, user: { id: contact.user?.id } },
        ])
        .valueSeq()
        .sortBy((contact) => contact.name)
        .groupBy((contact) => contact.count)
        .toArray()
        .map(([count, contact]) =>
          tuple(
            count,
            contact.toJS() as [{ user: { id: undefined | string }; name: string; count: number; id: string }],
          ),
        )
        .sort(byCountDescending);
      const queryAllVenues = em.createQueryBuilder(Gig, "g");
      queryAllVenues
        .where({ type: { code: { $in: ["gig", "calendar"] } } })
        .joinAndSelect("g.venue", "gv")
        .groupBy(["gv.id"])
        .select(["count(g.id)", "gv.latitude", "gv.longitude", "gv.map_link", "gv.name", "gv.subvenue", "gv.id"]);
      const queryMyVenues = em.createQueryBuilder(Gig, "g");
      queryMyVenues
        .join("g.lineup", "gl")
        // TODO this should probably filter for only past gigs (and maybe only gigs)
        .where({ lineup: { user: session.userId, approved: true } })
        .joinAndSelect("g.venue", "gv")
        .groupBy(["gv.id"])
        .select(["count(g.id)", "gv.id"]);
      const myVenues = await queryMyVenues.execute("all");
      const myVenueCounts: Map<string, string> = new Map(
        myVenues.map((venue: { id: string; count: string }) => [venue.id, venue.count]),
      );
      const queryUnusedVenues = em.createQueryBuilder(GigVenue, "gv");
      queryUnusedVenues
        .leftJoin("gv.gigs", "g")
        .where({ gigs: { $exists: false } })
        .select(["gv.latitude", "gv.longitude", "gv.map_link", "gv.name", "gv.subvenue", "gv.id"]);
      const allVenues = await queryAllVenues
        .execute("all")
        .then((venues) =>
          queryUnusedVenues
            .execute("all")
            .then((unused) => [...venues, ...unused.map((v: object) => ({ ...v, count: "0" }))]),
        )
        .then((venues) =>
          venues.map(
            ({
              map_link: mapLink,
              count: totalEvents,
              name,
              id,
              latitude,
              longitude,
              subvenue,
            }: {
              map_link: string;
              count: string;
              name: string;
              id: string;
              latitude: string;
              longitude: string;
              subvenue: string;
            }) => ({
              id,
              name,
              totalEvents: parseInt(totalEvents),
              currentUserEvents: parseInt(myVenueCounts.get(id) || "0"),
              mapLink,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              subvenue,
            }),
          ),
        );
      return {
        venue,
        session: { ...session, save: undefined, destroy: undefined },
        lineupPeople,
        contacts,
        allVenues,
        subvenues,
      };
    } else {
      throw error(404, "Venue not found");
    }
  } else {
    throw error(403, "You're not allowed to do that!");
  }
};
