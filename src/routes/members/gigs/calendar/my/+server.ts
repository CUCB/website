import { redirect } from "@sveltejs/kit";
import { mygigsCalendarUrl } from "../../../../data/cal.php/+server";

export async function GET({ locals: { session } }) {
  throw redirect(302, mygigsCalendarUrl(session.userId));
}
