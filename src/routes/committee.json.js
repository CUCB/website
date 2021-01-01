import { makeClient } from "../graphql/client";
import { currentCommittee } from "../graphql/committee";
import fetch from "node-fetch";
import dayjs from "dayjs";

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

export async function get(req, res, next) {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = req.headers.host.split(":")[0] !== "127.0.0.1" ? `${protocol}://${req.headers.host}` : undefined;
  const client = await makeClient(fetch, { host });

  // Return from cache if recent enough
  if (!retrieved || dayjs() - retrieved > 1000 * 3600) {
    try {
      const graphqlRes = await client.query({
        query: currentCommittee,
      });
      cached =
        graphqlRes.data.cucb_committees &&
        graphqlRes.data.cucb_committees[0] &&
        graphqlRes.data.cucb_committees[0].committee_members;
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: `Something went wrong. Let the webmaster know and they'll try and help you.`,
          code: e.graphqlErrors[0].extensions.code,
        }),
      );
      return;
    }
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ committee: cached, retrieved }));
}
