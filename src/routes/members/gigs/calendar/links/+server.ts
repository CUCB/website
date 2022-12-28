import { json } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../../../client-auth";
import { mygigsCalendarUrl, allgigsCalendarUrl } from "../../../../data/cal.php/+server";
import type { RequestEvent } from "./$types";

export async function GET({ locals }: RequestEvent): Promise<Response> {
  const session = assertLoggedIn(locals.session);

  return json({
    allgigs: allgigsCalendarUrl(session.userId),
    mygigs: mygigsCalendarUrl(session.userId),
  });
}
