import { handleErrors } from "../../../graphql/client";
import type { PageServerLoad } from "./$types";
import { Committee } from "$lib/entities/Committee";
import orm from "$lib/database";
import { QueryOrder, wrap } from "@mikro-orm/core";

interface Committee_<DateOrString> {
  started: DateOrString;
  members: CommitteeMember[];
}

interface CommitteeMember {
  name: string;
  pic?: string;
  sub_position?: string;
  comments?: string;
  email_obfus?: string;
  april_fools_dir?: string;
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
  try {
    const committeeRepository = orm.em.fork().getRepository(Committee);
    const mikroOrmRes = await committeeRepository.find(
      { started: { $lte: "now()" } },
      {
        offset: 1,
        // A limit is required for offset to work, it's also probably sensible to ave
        limit: 100,
        orderBy: { started: QueryOrder.DESC },
        fields: ["members", "started"],
        populate: ["members.lookup_name", "members.position"],
      },
    );
    const committees: Committee_<Date>[] = mikroOrmRes.map((c) => wrap(c).toObject());
    return { aprilFools, committees };
  } catch (e) {
    console.error(e);
    return handleErrors(e);
  }
};