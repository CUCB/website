import { env } from "$env/dynamic/private";
import { QueryOrder, type QueryOrderMap } from "@mikro-orm/core";
import { error } from "@sveltejs/kit";
import { Literal, Union } from "runtypes";
import { assertLoggedIn } from "../../../../client-auth";
import type { Music } from "../../../../lib/entities/Music";
import { multipleAbcFiles } from "../generateAbc";
import type { RequestEvent } from "./$types";

const validFolder = Union(Literal("archived"), Literal("current"), Literal("all"));
const validFiletype = Union(Literal("abc"), Literal("ps"), Literal("pdf"));
const OrderBy = Union(Literal("type"), Literal("title"));

export const GET = ({ locals, url, params: { folder, filetype } }: RequestEvent): Promise<Response | undefined> => {
  assertLoggedIn(locals.session);
  let orderBy: QueryOrderMap<Music> = { title: QueryOrder.ASC };
  let orderByParam = url.searchParams.get("orderBy");
  if (orderByParam) {
    if (OrderBy.guard(orderByParam)) {
      if (orderByParam === "type") {
        orderBy = { type: { name: QueryOrder.ASC }, title: QueryOrder.ASC };
      }
    } else {
      throw error(404, "Unknown value for orderBy parameter");
    }
  }
  if (validFolder.guard(folder)) {
    if (validFiletype.guard(filetype)) {
      return multipleAbcFiles(filetype, url.searchParams, folder, orderBy, env);
    } else {
      throw error(404, "Unknown file type");
    }
  } else {
    throw error(404, "Folder not found");
  }
};
