import type { PageServerLoad } from "./$types";
import { Committee } from "$lib/entities/Committee";
import orm from "$lib/database";
import { QueryOrder, wrap } from "@mikro-orm/core";
import { fetchCommittees } from "../queries";

interface Committee_<DateOrString> {
  started: DateOrString;
  members: CommitteeMember[];
}

interface CommitteeMember {
  name: string;
  pic?: string;
  sub_position?: string | null;
  comments?: string | null;
  email_obfus?: string | null;
  april_fools_dir?: string | null;
  april_fools_only: boolean;
  lookup_name: {
    name: string;
  };
  committee: {
    pic_folder?: string;
  };
  position: {
    name: string;
  };
}

export const load: PageServerLoad = async ({ url }) => {
  let aprilFools = url.searchParams.get("aprilfool") !== null;
  // offset is only applied if it used along with a limit, so include a limit here
  // (I'm not currently sure if this is a Postgres or a mikro-orm limitation)
  // TODO make sure Cypress tests check this doesn't show the current committee
  // TODO make sure Cypress tests check this shows the relevant pictures
  const committees: Committee_<Date>[] = await fetchCommittees({}, { limit: 200, offset: 1 });
  return { aprilFools, committees };
};
