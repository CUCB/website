import { QueryEditGigDetails, QueryVenues, QueryGigTypes, QueryContacts } from "../../../../../graphql/gigs";
import { assertLoggedIn } from "../../../../../client-auth";
import { makeClient, handleErrors } from "../../../../../graphql/client";
import { error } from "@sveltejs/kit";
import { sortContacts, sortVenues } from "./sort";

export async function load({ params, fetch, parent }) {
  let { gig_id } = params;

  const { session } = await parent();
  assertLoggedIn(session);

  let client = makeClient(fetch);

  let res_gig, res_venues, res_gigTypes, res_contacts;
  let gig, venues, gigTypes, allContacts;
  try {
    res_gig = await client.query({
      query: QueryEditGigDetails,
      variables: { gig_id },
    });
    res_venues = await client.query({
      query: QueryVenues,
    });
    res_gigTypes = await client.query({
      query: QueryGigTypes,
    });
    res_contacts = await client.query({
      query: QueryContacts,
    });
  } catch (e) {
    return handleErrors(e, session);
  }

  if (res_gig && res_gig.data && res_gig.data.cucb_gigs_by_pk) {
    gig = res_gig.data.cucb_gigs_by_pk;
    venues = res_venues.data.cucb_gig_venues;
    gigTypes = res_gigTypes.data.cucb_gig_types;
    allContacts = res_contacts.data.cucb_contacts;
    sortVenues(venues);
    sortContacts(gig.contacts);
  } else {
    throw error(404, "Gig not found");
  }

  return {
    ...gig,
    lastSaved: gig,
    venues,
    gigTypes,
    allContacts,
  };
}
