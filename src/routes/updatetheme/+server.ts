import { json } from "@sveltejs/kit";
import { assertLoggedIn } from "../../client-auth";
import type { RequestEvent, RequestHandler } from "./$types";

export const POST = async ({ locals, request }: RequestEvent): Promise<Response> => {
  const session = assertLoggedIn(locals.session);
  session.theme = Object.fromEntries(await request.formData()) as Record<string, string>;
  await session.save(); // TODO handle errors
  return json(session);
};
