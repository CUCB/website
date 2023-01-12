import orm from "$lib/database";
import { assertLoggedIn } from "../../../client-auth";
import { Music } from "$lib/entities/Music";
import type { PageServerLoad } from "./$types";
import { QueryOrder, wrap } from "@mikro-orm/core";
import { MusicType } from "../../../lib/entities/MusicType";

export const load: PageServerLoad = async ({ locals }) => {
  const session = assertLoggedIn(locals.session);

  const em = (await orm()).em.fork();
  const currentSets = await em
    .find(
      Music,
      { current: true },
      { orderBy: { type: { name: QueryOrder.ASC }, title: QueryOrder.ASC }, populate: ["type"] },
    )
    .then((sets) => sets.map((set) => wrap(set).toPOJO()));
  const archivedSets = await em
    .find(
      Music,
      { current: false },
      { orderBy: { type: { name: QueryOrder.ASC }, title: QueryOrder.ASC }, populate: ["type"] },
    )
    .then((sets) => sets.map((set) => wrap(set).toPOJO()));
  const types = await em
    .find(MusicType, {}, { orderBy: { name: QueryOrder.ASC } })
    .then((types) => types.map((type) => wrap(type).toPOJO()));
  return { currentSets, archivedSets, types };
};
