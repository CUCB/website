import { Committee } from "$lib/entities/Committee";
import orm from "$lib/database";
import { QueryOrder } from "@mikro-orm/core";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const committeeRepository = orm.em.fork().getRepository(Committee);
  const committee = await committeeRepository
    .findOne(
      { started: { $lte: "now()" } },
      { orderBy: { started: QueryOrder.DESC }, populate: ["members.position", "members.lookup_name"] },
    )
    .then((c) => c?.members.toArray());
  const aprilFools = url.searchParams.get("aprilfool") !== null;
  if (committee) {
    return { aprilFools, committee };
  } else {
    throw error(404, "Committee not found");
  }
};
