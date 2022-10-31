import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { session }, request }) => {
  // const body = Object.fromEntries(await request.formData());
  session.theme = Object.fromEntries(await request.formData());
  await session.save(); // TODO handle errors
  return json(session);
};
