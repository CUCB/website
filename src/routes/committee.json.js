import { makeClient } from "../graphql/client";
import { currentCommittee } from "../graphql/committee";
import fetch from "node-fetch";
import moment from "moment";

let cached;
let retrieved;

export async function get(req, res, next) {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = req.headers.host.split(":")[0] !== "127.0.0.1" ? `${protocol}://${req.headers.host}` : undefined;
  const client = await makeClient(fetch, { host });

  // Return from cache if recent enough
  if (!retrieved || moment() - retrieved > 1000 * 3600) {
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
