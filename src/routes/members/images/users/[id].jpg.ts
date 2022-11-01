import { readFile, writeFile, rename } from "fs/promises";
import { makeServerGraphqlClient } from "../../../../auth";
import { GuardUpdateBio } from "../../../../graphql/user";

export function image_path(id: string): string {
  return `images/users/${id}.jpg`;
}

let NONE = null;

export async function get({ locals, params }) {
  if (!locals.session.userId) {
    return { status: 401, body: "Not logged in" };
  } else {
    try {
      const file = await readFile(image_path(params?.id));
      return { status: 200, "content-type": "image/jpeg", body: file };
    } catch (e) {
      try {
        if (!NONE) {
          NONE = await readFile(image_path("none"));
        }
        return { status: 200, "content-type": "image/jpeg", body: NONE };
      } catch (e) {
        return { status: 500, body: e };
      }
    }
  }
}

export async function post({ locals, params, body, headers }) {
  if (!locals.session.userId) {
    return { status: 401, body: "Not logged in" };
  } else {
    if (params.id != locals.session.userId) {
      const client = makeServerGraphqlClient({
        role: locals.session.alternativeRole || locals.session.hasuraRole,
        headers: { "x-hasura-user-id": locals.session.userId },
      });
      try {
        client.mutate({ mutation: GuardUpdateBio, variables: { userId: params.id } });
      } catch (e) {
        return { status: 403, body: "You can only upload a profile picture for yourself" };
      }
    }

    const imageBase64Data = body.split(",")[1];
    await writeFile(`${image_path(params.id)}.tmp`, imageBase64Data, { encoding: "base64" });
    await rename(`${image_path(params.id)}.tmp`, image_path(params.id));

    return {
      status: 200,
      body: "",
    };
  }
}
