import { GraphQLClient, handleErrors } from "../../../../graphql/client";
import { assertLoggedIn } from "../../../../client-auth.js";
import { QueryAllGigSignupSummary } from "../../../../graphql/gigs";
import { DateTime, Settings } from "luxon";
import type { Gig } from "./types";
import type { PageLoad } from "./$types";
import { SELECT_GIG_LINEUPS } from "$lib/permissions";
import { error } from "@sveltejs/kit";
import orm from "$lib/database";
import { Gig as DbGig } from "$lib/entities/Gig";
import { wrap } from "@mikro-orm/core";

export const load: PageLoad = async ({ fetch, parent }) => {
  Settings.defaultZoneName = "Europe/London";

  const { session } = await parent();
  assertLoggedIn(session);

  if (SELECT_GIG_LINEUPS.guard(session)) {
    const em = orm.em.fork();
    const [signupsOpen, sinceOneMonth] = await Promise.all([
      em.find(
        DbGig,
        { allow_signups: { $eq: true }, admins_only: { $eq: false } },
        { populate: ["lineup", "lineup.user"] },
      ),
      em.find(
        DbGig,
        { date: { $gt: DateTime.local().minus({ months: 1 }).toISO() } },
        { populate: ["lineup", "lineup.user"] },
      ),
    ]).then((arr) =>
      arr.map((arr) =>
        arr.map((e) => ({
          ...wrap(e).toPOJO(),
          date: DateTime.fromJSDate(e.date).toISODate(),
          lineup: e.lineup.toArray(),
        })),
      ),
    );

    return {
      sinceOneMonth,
      signupsOpen,
    };
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
