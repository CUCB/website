import { Committee } from "$lib/entities/Committee";
import orm from "$lib/database";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { fetchLatestCommittee } from "./queries";

export const load: PageServerLoad = async ({ url }) => {
  const committee = await fetchLatestCommittee().then((c) => c?.members);
  const aprilFools = url.searchParams.get("aprilfool") !== null;
  if (committee) {
    return { aprilFools, committee };
  } else {
    throw error(404, "Committee not found");
  }
};
