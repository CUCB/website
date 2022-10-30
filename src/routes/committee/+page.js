import { makeClient, handleErrors } from "../../graphql/client";
import { currentCommitteePictures } from "../../graphql/committee";
export async function load({ url, fetch, parent }) {
  const { session } = await parent();
  const aprilFools = url.searchParams.get("aprilfool") !== null;
  const client = makeClient(fetch);
  let res;
  try {
    res = await client.query({ query: currentCommitteePictures });
    return { aprilFools, committee: res.data.cucb_committees[0].committee_members };
  } catch (e) {
    return handleErrors(e, session);
  }
}
