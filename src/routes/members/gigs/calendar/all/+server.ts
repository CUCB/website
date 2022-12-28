import { redirect } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../../../client-auth";
import { allgigsCalendarUrl } from "../../../../data/cal.php/+server";
import type { RequestEvent } from "./$types";

export async function GET({ locals }: RequestEvent): Promise<Response> {
  const session = assertLoggedIn(locals.session);
  throw redirect(302, allgigsCalendarUrl(session.userId));
}
