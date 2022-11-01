import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { stat } from "fs/promises";
import { image_path } from "../+server";
export const GET: RequestHandler = async ({ locals, params: { id } }) => {
  if (!locals.session.userId) {
    throw error(401, "Not logged in");
  } else {
    try {
      const statResult = await stat(image_path(id));
      return new Response(statResult.mtime.toDateString());
    } catch (e) {
      return new Response("");
    }
  }
};
