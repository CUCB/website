import { extractAttributes } from "../../../../../graphql/gigs/lineups/users/attributes";
import { QueryGigLineup, AllUserNames } from "../../../../../graphql/gigs/lineups";
import { QueryGigType } from "../../../../../graphql/gigs";
import { handleErrors, client } from "../../../../../graphql/client";
import { assertLoggedIn } from "../../../../../client-auth.js";
import type { PageLoad } from "./$types";
import { get } from "svelte/store";
import { error } from "@sveltejs/kit";
import type { Instrument, UserInstrument } from "../../../user/[id=integer]/types";

interface UserName {
  id: number;
  first: string;
  last: string;
}

interface PersonQuery {
  user: {
    id: number;
    first: string;
    last: string;
    prefs: {
      pref_type: {
        name: string;
      };
      value: boolean;
    }[];
  };
  user_available: boolean | null;
  user_only_if_necessary: boolean | null;
  approved: boolean | null;
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
    id: number;
    attributes: string[];
  };
  user_available: boolean | null;
  user_only_if_necessary: boolean | null;
  approved: boolean | null;
  user_instruments: Record<number, LineupInstrument>;
  leader: boolean;
  equipment: boolean;
  money_collector: boolean;
  money_collector_notified: boolean;
}

interface GigTypeRes {
  type: {
    code: string;
    id: number;
  };
  title: string;
}

export const load: PageLoad = async ({ params: { gig_id }, parent }) => {
  const { session } = await parent();
  assertLoggedIn(session);

  let res, res_allPeople;
  let people: PersonQuery[], allPeople: UserName[], title: string;
  try {
    let gigType = await get(client).query<{ cucb_gigs_by_pk: GigTypeRes }>({
      query: QueryGigType,
      variables: { id: gig_id },
    });
    if (gigType?.data?.cucb_gigs_by_pk?.type.code === "gig") {
      res = await get(client).query({
        query: QueryGigLineup,
        variables: { gig_id },
      });
      res_allPeople = await get(client).query({
        query: AllUserNames,
      });
      title = gigType.data.cucb_gigs_by_pk.title;
    }
  } catch (e) {
    return handleErrors(e, session);
  }

  if (res?.data?.cucb_gigs_by_pk) {
    people = res.data.cucb_gigs_by_pk.lineup;
    allPeople = res_allPeople.data.cucb_users;
  } else {
    throw error(404, "Gig not found");
  }

  let personLookup: Record<number, Person> = {};
  for (let person of people) {
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
};

interface LineupInstrument {
  user_instrument: UserInstrument;
  instrument: Instrument;
  approved: boolean | null;
}

function userInstrumentsById(instrument_list: LineupInstrument[]): Record<number, LineupInstrument> {
  return Object.fromEntries(instrument_list.map((instrument) => [instrument.user_instrument.id, instrument]));
}
