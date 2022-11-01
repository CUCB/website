import { json } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../../../client-auth";
import { mygigsCalendarUrl, allgigsCalendarUrl } from "../../../../data/cal.php/+server";

export async function GET({ locals: { session } }) {
  assertLoggedIn(session);

  return json({
    allgigs: allgigsCalendarUrl(session.userId),
    mygigs: mygigsCalendarUrl(session.userId),
  });
}
