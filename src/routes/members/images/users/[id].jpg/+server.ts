import type { RequestHandler } from "./$types";
import { readFile, writeFile, rename, rm } from "fs/promises";
import { makeServerGraphqlClient } from "../../../../../auth";
import { GuardUpdateBio } from "../../../../../graphql/user";
import { error } from "@sveltejs/kit";

export function image_path(id: string): string {
  return `images/users/${id}.jpg`;
}

let NONE = null;

export const GET: RequestHandler = async ({ locals, params: { id } }) => {
  if (!locals.session.userId) {
    throw error(401, "Not logged in");
  } else {
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
  }
};

export const POST: RequestHandler = async ({ locals, params: { id }, request }) => {
  if (!locals.session.userId) {
    throw error(401, "Not logged in");
  } else {
    if (id != locals.session.userId) {
      const client = makeServerGraphqlClient({
        role: locals.session.alternativeRole || locals.session.hasuraRole,
        headers: { "x-hasura-user-id": locals.session.userId },
      });
      try {
        client.mutate({ mutation: GuardUpdateBio, variables: { userId: id } });
      } catch (e) {
        throw error(403, "You can only upload a profile picture for yourself");
      }
    }

    const body = await request.text();
    const imageBase64Data = body.split(",")[1];
    await writeFile(`${image_path(id)}.tmp`, imageBase64Data, { encoding: "base64" });
    await rename(`${image_path(id)}.tmp`, image_path(id));

    return new Response();
  }
};

export const DELETE: RequestHandler = async ({ locals, params: { id } }) => {
  if (!locals.session.userId) {
    throw error(401, "Not logged in");
  } else if (locals.session.userId != id) {
    throw error(403, "You can only remove your own profile picture");
  } else {
    try {
      await rm(image_path(id));
      return new Response();
    } catch (e) {
      throw error(404, "You don't have a profile picture uploaded");
    }
  }
};
