import type { RequestHandler } from "./$types";
import { stat } from "fs/promises";
import { image_path } from "../+server";
import { assertLoggedIn } from "../../../../../../client-auth";
export const GET: RequestHandler = async ({ locals, params: { id } }) => {
  assertLoggedIn(locals.session);

  try {
    const statResult = await stat(image_path(id));
    return new Response(statResult.mtime.toDateString());
  } catch (e) {
    return new Response("");
  }
};
