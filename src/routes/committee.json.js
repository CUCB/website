import { makeClient, handleErrors } from "../graphql/client";
import { currentCommittee } from "../graphql/committee";
import fetch from "node-fetch";
import moment from "moment-timezone";

let cached;
let retrieved;

export async function get(req, res, next) {
  const client = await makeClient(fetch);

  // Return from cache if recent enough
  if (!cached || moment() - retrieved > 1000 * 3600) {
    try {
      let time = moment();
      const graphqlRes = await client.query({
        query: currentCommittee,
        variables: { current_date: time.toISOString() },
      });
      retrieved = time;
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
