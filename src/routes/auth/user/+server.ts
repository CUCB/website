import { error, json } from "@sveltejs/kit";
import { LOGGED_IN } from "../../../lib/permissions";
import type { RequestEvent } from "./$types";

export const GET = ({ locals: { session } }: RequestEvent): Response => {
  if (LOGGED_IN.guard(session)) {
    return json({ id: session.userId });
  } else {
    throw error(401, "Not logged in");
  }
};
