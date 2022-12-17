import { assertLoggedIn } from "../../../../../client-auth.js";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import type { UserInstrument } from "../../../users/[id=integer]/types";
import { PopulateHint, type EntityManager } from "@mikro-orm/core";
import { Gig } from "../../../../../lib/entities/Gig";
import orm from "../../../../../lib/database";
import { SELECT_GIG_LINEUPS } from "../../../../../lib/permissions";
import { User } from "../../../../../lib/entities/User";
import { wrap } from "@mikro-orm/core";
import { extractAttributes } from "./attributes";

interface UserName {
  id: string;
  first: string;
  last: string;
  gig_notes: string;
}

interface PersonQuery {
  user: {
    id: string;
    first: string;
    last: string;
    gig_notes: string;
    prefs: {
      pref_type: {
        name: string;
      };
      value: boolean;
    }[];
  };
  user_available?: boolean;
  user_only_if_necessary?: boolean;
  approved?: boolean | null;
  user_instruments: LineupInstrument[];
  leader: boolean;
  equipment: boolean;
  money_collector: boolean;
  money_collector_notified: boolean;
}

interface Person {
  user: {
    first: string;
    last: string;
    id: string;
    attributes: string[];
    gig_notes: string;
  };
  user_available?: boolean;
  user_only_if_necessary?: boolean;
  approved?: boolean | null;
  user_instruments: Record<string, LineupInstrument>;
  leader: boolean;
  equipment: boolean;
  money_collector: boolean;
  money_collector_notified: boolean;
}

const fetchGigLineup = (id: string, em: EntityManager): Promise<null | { lineup: PersonQuery[]; title: string }> =>
  em
    .findOne(
      Gig,
      { id, type: { code: "gig" } },
      {
        populate: [
          "type",
          "lineup",
          "lineup.user",
          "lineup.user.instruments",
          "lineup.user.instruments.instrument",
          "lineup.user_instruments",
          "lineup.user_instruments.user_instrument",
          "lineup.user_instruments.user_instrument.instrument",
          "lineup.user.prefs",
          "lineup.user.prefs.pref_type",
        ],
      },
    )
    .then((e) => e && { lineup: e.lineup.toArray(), title: e.title });

const fetchAllUsers = (em: EntityManager): Promise<UserName[]> =>
  em
    .find(
      User,
      { adminType: { hasuraRole: { $ne: "music_only" } } },
      { fields: ["id", "first", "last", "gig_notes"], populateWhere: PopulateHint.INFER },
    )
    .then((e) => e.map((e) => wrap(e).toPOJO()));

export const load: PageServerLoad = async ({ params: { gig_id }, parent }) => {
  const { session } = await parent();
  assertLoggedIn(session);

  if (SELECT_GIG_LINEUPS.guard(session)) {
    const em = orm.em.fork();
    const [allPeople, gig] = await Promise.all([fetchAllUsers(em), fetchGigLineup(gig_id, em)]);
    if (gig) {
      const { lineup, title } = gig;
      let personLookup: Record<string, Person> = {};
      for (let person of lineup) {
        personLookup[person.user.id] = {
          ...person,
          user: {
            ...person.user,
            attributes: extractAttributes(person.user),
          },
          user_instruments: userInstrumentsById(person.user_instruments),
        };
      }
      return { people: personLookup, gigId: gig_id, allPeople, title };
    } else {
      throw error(404, "Gig not found");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};

interface LineupInstrument {
  user_instrument: UserInstrument;
  approved?: boolean | null;
}

function userInstrumentsById(instrument_list: LineupInstrument[]): Record<string, LineupInstrument> {
  return Object.fromEntries(instrument_list.map((instrument) => [instrument.user_instrument.id, instrument]));
}
