import { currentCommittee } from "../graphql/committee";
import fetch from "isomorphic-fetch";
import { DateTime } from "luxon";
import dotenv from "dotenv";
import { GraphQLClient } from "../graphql/client";

dotenv.config();
let cached;
let retrieved;

export let fallbackPeople = [
  {
    name: "The President",
    casual_name: "The President",
    email_obfus: "p_r__esid_ent@cu_cb.co.uk",
    committee_key: {
      name: "president",
      __typename: "cucb_committee_keys",
    },
    __typename: "cucb_committee_members",
  },
  {
    name: "The Secretary",
    casual_name: "The Secretary",
    email_obfus: "se_cre_tar_y@cucb.co.uk",
    committee_key: {
      name: "secretary",
      __typename: "cucb_committee_keys",
    },
    __typename: "cucb_committee_members",
  },
  {
    name: "The Webmaster",
    casual_name: "The Webmaster",
    email_obfus: "we__bma_ster_@cucb._co.uk",
    committee_key: {
      name: "webmaster",
      __typename: "cucb_committee_keys",
    },
    __typename: "cucb_committee_members",
  },
];

export async function get() {
  const client = new GraphQLClient(fetch, { domain: process.env["GRAPHQL_REMOTE"] });

  // Return from cache if recent enough
  if (!retrieved || DateTime.local().diff(retrieved).hours > 0) {
    try {
      const graphqlRes = await client.query({
        query: currentCommittee,
      });
      cached = graphqlRes?.data?.cucb_committees?.[0]?.committee_members;
    } catch (e) {
      if (e.graphQLErrors?.length > 0) {
        return {
          status: 500,
          body: {
            message: `Something went wrong. Let the webmaster know and they'll try and help you.`,
            code: e.graphQLErrors[0].extensions.code,
          },
        };
      } else {
        return {
          status: 500,
          body: {
            message: `Something went wrong. Let the webmaster know and they'll try and help you.`,
            code: e.networkError,
          },
        };
      }
    }
  }

  return {
    status: 200,
    body: { committee: cached, retrieved },
  };
}
