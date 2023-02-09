import { error } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../../client-auth";
import { NOT_MUSIC_ONLY } from "$lib/permissions";
import type { LayoutServerLoad } from "./$types";
import orm from "$lib/database";
import { GigVenue } from "$lib/entities/GigVenue";
import { QueryOrder, wrap } from "@mikro-orm/core";
import { Gig } from "$lib/entities/Gig";
import type { EntityManager } from "@mikro-orm/postgresql";

export const load: LayoutServerLoad = async ({ params, locals }) => {
  const session = assertLoggedIn(locals.session);
  if (NOT_MUSIC_ONLY.guard(session)) {
    const em = (await orm()).em.fork() as EntityManager;
    const allVenueNames = await em
      .find(
        GigVenue,
        {},
        {
          fields: ["name", "subvenue", "id", "address", "postcode"],
          orderBy: { name: QueryOrder.ASC, subvenue: QueryOrder.ASC_NULLS_FIRST },
        },
      )
      .then((res) => res.map((res) => wrap(res).toPOJO()));
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
      session: { ...session, save: undefined, destroy: undefined },
      allVenues,
      allVenueNames,
    };
  } else {
    throw error(403, "You're not allowed to do that!");
  }
};
