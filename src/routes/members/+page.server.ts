import { assertLoggedIn } from "../../client-auth.js";
import type { PageServerLoad } from "./$types";
import { NOT_MUSIC_ONLY } from "../../lib/permissions";
import { redirect } from "@sveltejs/kit";
import orm from "../../lib/database";
import { UserInstrument } from "../../lib/entities/UsersInstrument";
import { EntityManager, LoadStrategy, PopulateHint, wrap } from "@mikro-orm/core";
import { Gig } from "../../lib/entities/Gig";
import { User } from "../../lib/entities/User.js";
import type { AvailableUserInstrument, SignupGig } from "./types";

export const fetchSignupGigs = (em: EntityManager, session: { userId: string }): Promise<SignupGig[]> =>
  em
    .find(
      Gig,
      { admins_only: false, allow_signups: true },
      {
        fields: [
          "id",
          "date",
          "title",
          "lineup.user_available",
          "lineup.user_only_if_necessary",
          "lineup.user_notes",
          "lineup.user_instruments.approved",
          "lineup.user_instruments.user_instrument.id",
          "lineup.user_instruments.user_instrument.nickname",
          "lineup.user_instruments.user_instrument.instrument",
          "lineup.user_instruments.user_instrument.instrument.name",
          "lineup.user_instruments.user_instrument.instrument.novelty",
          "lineup.user.id",
          "lineup.user.gig_notes",
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
    .then((res) =>
      res?.map((entry) => {
        let gig = wrap(entry).toPOJO();
        // I couldn't work out how to successfully filter the lineup such that it can be empty,
        // so this is a bit of a hack
        return {
          ...gig,
          lineup: gig.lineup
            .filter((entry) => entry.user.id == session.userId)
            // TODO remove me
            .map((entry) => ({
              ...entry,
              user_instruments: entry.user_instruments.map((ui) => ({
                ...ui,
                // user_instrument_id: ui.user_instrument.id,
              })),
            })),
        };
      }),
    );

export const fetchAvailableInstruments = (
  em: EntityManager,
  session: { userId: string },
): Promise<AvailableUserInstrument[]> =>
  em
    .find(
      UserInstrument,
      { user: session.userId, deleted: { $ne: true } },
      {
        fields: ["id", "nickname", "instrument", "instrument.name", "instrument.novelty"],
        populateWhere: PopulateHint.INFER,
      },
    )
    .then((res) => res?.map((entry) => wrap(entry).toPOJO()));

export const fetchUserNotes = (em: EntityManager, session: { userId: string }): Promise<string> =>
  em.findOneOrFail(User, { id: session.userId }, { fields: ["gig_notes"] }).then((res) => res.gig_notes);

export const load: PageServerLoad = async ({ parent }) => {
  const { session } = await parent();
  assertLoggedIn(session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const em = orm.em.fork();
    const [userInstruments, userNotes, gigSignups] = await Promise.all([
      fetchAvailableInstruments(em, session),
      fetchUserNotes(em, session),
      fetchSignupGigs(em, session),
    ]);

    return { gigSignups, userInstruments, userNotes };
  } else {
    throw redirect(302, "/members/music");
  }
};
