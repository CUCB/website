import { redirect } from "@sveltejs/kit";
import { gigCalendarUrl } from "../../../../data/cal.php/+server";

export async function GET({ params: { gig_id }, locals: { session } }) {
  console.log(gigCalendarUrl(gig_id, session.userId));
  throw redirect(302, gigCalendarUrl(gig_id, session.userId));
}
