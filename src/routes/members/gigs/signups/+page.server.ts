import { assertLoggedIn } from "../../../../client-auth.js";
import { DateTime, Settings } from "luxon";
import type { PageServerLoad } from "./$types";
import { SELECT_GIG_LINEUPS } from "$lib/permissions";
import { error } from "@sveltejs/kit";
import orm from "$lib/database";
import { Gig as DbGig } from "$lib/entities/Gig";
import type { Gig } from "./types";
import { EntityManager, wrap } from "@mikro-orm/core";

const fetchSignupsOpen = (em: EntityManager): Promise<Gig[]> =>
  em
    .find(DbGig, { allow_signups: { $eq: true }, admins_only: { $eq: false } }, { populate: ["lineup", "lineup.user"] })
    .then((arr) =>
      arr.map((e) => ({
        ...wrap(e).toPOJO(),
        // TODO date is never null, nothing in the prod database has it null!
        // TODO test that date is required for a gig when being added
        date: e.date && DateTime.fromJSDate(e.date).toISODate(),
        lineup: e.lineup.toArray(),
        sort_date: e.sort_date,
      })),
    );

const fetchSinceOneMonth = (em: EntityManager): Promise<Gig[]> =>
  em
    .find(
      DbGig,
      { date: { $gt: DateTime.local().minus({ months: 1 }).toISO() } },
      { populate: ["lineup", "lineup.user"] },
    )
    .then((arr) =>
      arr.map((e) => ({
        ...wrap(e).toPOJO(),
        date: e.date && DateTime.fromJSDate(e.date).toISODate(),
        lineup: e.lineup.toArray(),
        sort_date: e.sort_date,
      })),
    );

export const load: PageServerLoad = async ({ locals }) => {
  Settings.defaultZoneName = "Europe/London";

  const { session } = locals;
  assertLoggedIn(session);

  if (SELECT_GIG_LINEUPS.guard(session)) {
    const em = (await orm()).em.fork();
    const [signupsOpen, sinceOneMonth] = await Promise.all([fetchSignupsOpen(em), fetchSinceOneMonth(em)]);

    return {
      sinceOneMonth,
      signupsOpen,
    };
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
