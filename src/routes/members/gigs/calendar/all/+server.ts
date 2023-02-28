import { redirect } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../../../client-auth";
import { _allgigsCalendarUrl } from "../../../../data/cal.php/+server";
import type { RequestEvent } from "./$types";

export async function GET({ locals }: RequestEvent): Promise<Response> {
  const session = assertLoggedIn(locals.session);
  throw redirect(302, _allgigsCalendarUrl(session.userId));
}
