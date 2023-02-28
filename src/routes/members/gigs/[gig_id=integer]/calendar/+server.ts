import { redirect } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";
import { _gigCalendarUrl } from "../../../../data/cal.php/+server";
import { assertLoggedIn } from "../../../../../client-auth";

export async function GET({ params: { gig_id }, locals }: RequestEvent) {
  const session = assertLoggedIn(locals.session);
  throw redirect(302, _gigCalendarUrl(gig_id, session.userId));
}
