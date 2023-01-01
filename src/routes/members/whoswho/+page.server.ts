import orm from "$lib/database";
import { User } from "$lib/entities/User";
import { QueryOrder, wrap, type EntityField, type QueryOrderMap } from "@mikro-orm/core";
import { error } from "@sveltejs/kit";
import { Literal, Null, type Static } from "runtypes";
import type { PageServerLoad } from "./$types";

const fields: EntityField<User, string>[] = ["id", "first", "last", "bio"];

const sorter = Literal("login").Or(Literal("name")).Or(Null);

export const load: PageServerLoad = async ({ url, fetch }) => {
  let currentPage: number;
  try {
    currentPage = parseInt(url.searchParams.get("page") ?? "1");
  } catch {
    throw error(400, "Page must be a number");
  }
  const em = (await orm()).em;
  let orderBy: QueryOrderMap<User>[];
  let sort: Static<typeof sorter>;
  try {
    sort = sorter.check(url.searchParams.get("sort"));
    if (sort === "name") {
      orderBy = [{ first: QueryOrder.ASC }, { last: QueryOrder.ASC }];
    } else {
      orderBy = [{ lastLoginDate: QueryOrder.DESC_NULLS_LAST }];
    }
  } catch {
    throw error(400, "Can only sort by 'login' or 'name'");
  }

  const pageSize = 12;
  const totalPages = Math.floor(
    (await em.fork().count(User, { adminType: { role: { $ne: "music_only" } } })) / pageSize,
  );
  const users = await em
    .fork()
    .find(
      User,
      { adminType: { role: { $ne: "music_only" } } },
      {
        fields,
        offset: (currentPage - 1) * pageSize,
        limit: pageSize,
        orderBy,
      },
    )
    .then((users) => users.map((user) => wrap(user).toPOJO()));
  const profilePicturesUpdated = await Promise.all(
    users.map((user) => fetch(`/members/users/${user.id}/modified`).then((res) => res.text())),
  );
  return { totalPages, currentPage, users, profilePicturesUpdated, sort };
};
