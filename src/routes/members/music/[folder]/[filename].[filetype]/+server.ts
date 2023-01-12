import { error } from "@sveltejs/kit";
import { Literal, Union } from "runtypes";
import type { RequestEvent } from "./$types";
import { env } from "$env/dynamic/private";
import { singleAbcFile } from "../../generateAbc";
import { assertLoggedIn } from "../../../../../client-auth";

const validFolder = Union(Literal("archived"), Literal("current"));
const validFiletype = Union(
  Literal("abc"),
  Literal("ps"),
  Literal("pdf"),
  Literal("midi"),
  Literal("mp3"),
  Literal("ogg"),
);

export const GET = async ({ locals, params: { folder, filename, filetype }, url }: RequestEvent) => {
  assertLoggedIn(locals.session);
  if (validFolder.guard(folder)) {
    if (validFiletype.guard(filetype)) {
      return await singleAbcFile(filename, filetype, url.searchParams, folder, env);
    } else {
      throw error(404, "Unknown file type");
    }
  } else {
    throw error(404, "Folder not found");
  }
};
