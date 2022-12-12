import { assertLoggedIn } from "../../client-auth.js";
import type { PageServerLoad } from "./$types";
import { NOT_MUSIC_ONLY } from "../../lib/permissions";
import { redirect } from "@sveltejs/kit";
import orm from "../../lib/database";
import { UserInstrument } from "../../lib/entities/UsersInstrument";
import { LoadStrategy, PopulateHint, wrap } from "@mikro-orm/core";
import { Gig } from "../../lib/entities/Gig";
import { User } from "../../lib/entities/User.js";

export const load: PageServerLoad = async ({ parent }) => {
  const { session } = await parent();
  assertLoggedIn(session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const em = orm.em.fork();
    const userInstruments = await em
      .find(
        UserInstrument,
        { user: session.userId, deleted: { $ne: true } },
        {
          fields: ["nickname", "instrument", "instrument.name", "instrument.novelty"],
          populateWhere: PopulateHint.INFER,
        },
      )
      .then((res) => res?.map((entry) => wrap(entry).toPOJO()));
    let userNotes = await em
      .findOneOrFail(User, { id: session.userId }, { fields: ["gigNotes"] })
      .then((res) => res.gigNotes);
    let gigSignups = await em
      .find(
        Gig,
        { admins_only: false, allow_signups: true },
        {
          fields: [
            "date",
            "title",
            "lineup.user_available",
            "lineup.user_only_if_necessary",
            "lineup.user_notes",
            "lineup.user_instruments.approved",
            "lineup.id",
            "venue.map_link",
            "venue.name",
            "venue.subvenue",
            "finish_time",
            "arrive_time",
            "time",
          ],
          populateWhere: PopulateHint.INFER,
          strategy: LoadStrategy.JOINED,
        },
      )
      .then((res) => res?.map((entry) => wrap(entry).toPOJO()));

    // I couldn't work out how to successfully filter the lineup such that it can be empty,
    // so this is a bit of a hack
    gigSignups = gigSignups.map((gig) => ({
      ...gig,
      lineup: gig.lineup.filter((entry) => entry.user.id === session.userId),
    }));
    return { gigSignups, userInstruments, userNotes };
  } else {
    throw redirect(302, "/members/music");
  }
};
