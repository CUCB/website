import { json } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../../../client-auth";
import { _mygigsCalendarUrl, _allgigsCalendarUrl } from "../../../../data/cal.php/+server";
import type { RequestEvent } from "./$types";

export async function GET({ locals }: RequestEvent): Promise<Response> {
  const session = assertLoggedIn(locals.session);

  return json({
    allgigs: _allgigsCalendarUrl(session.userId),
    mygigs: _mygigsCalendarUrl(session.userId),
  });
}
