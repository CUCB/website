import { redirect } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";
import { gigCalendarUrl } from "../../../../data/cal.php/+server";
import { assertLoggedIn } from "../../../../../client-auth";

export async function GET({ params: { gig_id }, locals }: RequestEvent) {
  const session = assertLoggedIn(locals.session);
  throw redirect(302, gigCalendarUrl(gig_id, session.userId));
}
