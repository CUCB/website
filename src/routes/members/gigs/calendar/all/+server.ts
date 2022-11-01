import { redirect } from "@sveltejs/kit";
import { allgigsCalendarUrl } from "../../../../data/cal.php/+server";

export async function GET({ locals: { session } }) {
  throw redirect(302, allgigsCalendarUrl(session.userId));
}
