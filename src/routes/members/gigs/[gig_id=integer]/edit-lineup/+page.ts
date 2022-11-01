import { extractAttributes } from "../../../../../graphql/gigs/lineups/users/attributes";
import { QueryGigLineup, AllUserNames } from "../../../../../graphql/gigs/lineups";
import { QueryGigType } from "../../../../../graphql/gigs";
import { handleErrors, client } from "../../../../../graphql/client";
import { assertLoggedIn } from "../../../../../client-auth.js";
import type { PageLoad } from "./$types";
import { get } from "svelte/store";
import { error } from "@sveltejs/kit";

export const load: PageLoad = async ({ params: { gig_id }, parent }) => {
  const { session } = await parent();
  assertLoggedIn(session);

  let res, res_allPeople;
  let people, allPeople, title: string;
  try {
    let gigType = await get(client).query({
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

  let personLookup: Record<number, unknown> = {};
  for (let person of people) {
    person.user.attributes = extractAttributes(person.user);
    person.user.prefs = undefined;

    let user_instruments = {};
    for (let instrument of person.user_instruments) {
      user_instruments[instrument.user_instrument.id] = instrument;
    }
    person.user_instruments = user_instruments;
    personLookup[person.user.id] = person;
  }

  return { people: personLookup, gigId: gig_id, allPeople, title };
};
