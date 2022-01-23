import { stat } from "fs/promises";
import { image_path } from "../[id].jpg";
export async function get({ locals, params: { id } }) {
  if (!locals.session.userId) {
    return { status: 401, body: "Not logged in" };
  } else {
    const statResult = await stat(image_path(id));
    return { status: 200, body: statResult.mtime };
  }
}
