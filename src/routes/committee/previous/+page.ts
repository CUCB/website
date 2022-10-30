import { handleErrors, GraphQLClient } from "../../../graphql/client";
import { pastCommitteePictures } from "../../../graphql/committee";
import { DateTime } from "luxon";
import type { PageLoad } from "./$types";

interface Committee<DateOrString> {
  started: DateOrString;
  committee_members: CommitteeMember[];
}

interface CommitteeMember {
  name: string;
  pic: string | null;
  sub_position: string | null;
  comments: string | null;
  email_obfus: string;
  april_fools_dir: string | null;
  april_fools_only: boolean;
  committee_key: {
    name: string;
  };
  committee: {
    pic_folder: string;
  };
  position: {
    name: string;
  };
}

function parseStartedDate(committee: Committee<string>): Committee<DateTime> {
  return { ...committee, started: DateTime.fromISO(committee.started) };
}

export const load: PageLoad = async ({ url, fetch }) => {
  let aprilFools = url.searchParams.get("aprilfool") !== null;
  let client = new GraphQLClient(fetch);
  try {
    let res = await client.query<{ cucb_committees: Committee<string>[] }>({ query: pastCommitteePictures });
    return { aprilFools, committees: res.data.cucb_committees.map(parseStartedDate) };
  } catch (e) {
    console.error(e);
    return handleErrors(e);
  }
};
