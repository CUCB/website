import { json } from "@sveltejs/kit";
import { assertLoggedIn } from "../../client-auth";
import { IMPERSONATE_OTHER_ROLES } from "../../lib/permissions";
import type { RequestEvent } from "./$types";

export const POST = async ({ locals, request }: RequestEvent): Promise<Response> => {
  const session = assertLoggedIn(locals.session);
  session.theme = Object.fromEntries(await request.formData()) as Record<string, string>;
  if (IMPERSONATE_OTHER_ROLES.guard(session)) {
    session.alternativeRole = JSON.parse(session.theme.alternativeRole);
  }
  delete session.theme.alternativeRole;
  await session.save(); // TODO handle errors
  return json(session);
};
