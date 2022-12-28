import { error, redirect } from "@sveltejs/kit";
import { LOGGED_IN } from "$lib/permissions";
import { mygigsCalendarUrl } from "../../../../data/cal.php/+server";
import type { RequestEvent } from "./$types";
import { assertLoggedIn } from "../../../../../client-auth";

export async function GET({ locals }: RequestEvent) {
  const session = assertLoggedIn(locals.session);
  throw redirect(302, mygigsCalendarUrl(session.userId));
}
