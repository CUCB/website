import type { RequestHandler } from "./$types";
import { readFile, writeFile, rename, rm } from "fs/promises";
import { error } from "@sveltejs/kit";
import { UPDATE_BIO } from "$lib/permissions";
import { assertLoggedIn } from "../../../../../client-auth";
import { image_path } from "./path";

let NONE: Buffer | null = null;

export const GET: RequestHandler = async ({ locals, params: { id } }) => {
  assertLoggedIn(locals.session);

  try {
    const file = await readFile(image_path(id));
    return new Response(file, { headers: { "content-type": "image/jpeg" } });
  } catch (e) {
    try {
      if (!NONE) {
        NONE = await readFile(image_path("none"));
      }
      return new Response(NONE, { headers: { "content-type": "image/jpeg" } });
    } catch (e) {
      console.error(e);
      throw error(500, "Internal error");
    }
  }
};

export const POST: RequestHandler = async ({ locals, params: { id }, request }) => {
  const session = assertLoggedIn(locals.session);

  if (UPDATE_BIO(id).guard(session)) {
    const body = await request.text();
    const imageBase64Data = body.split(",")[1];
    await writeFile(`${image_path(id)}.tmp`, imageBase64Data, { encoding: "base64" });
    await rename(`${image_path(id)}.tmp`, image_path(id));

    return new Response();
  } else {
    throw error(403, "You can only upload a profile picture for yourself");
  }
};

export const DELETE: RequestHandler = async ({ locals, params: { id } }) => {
  const session = assertLoggedIn(locals.session);

  if (UPDATE_BIO(id).guard(session)) {
    try {
      await rm(image_path(id));
      return new Response();
    } catch (e) {
      throw error(404, "You don't have a profile picture uploaded");
    }
  } else {
    throw error(403, "You can only remove your own profile picture");
  }
};
