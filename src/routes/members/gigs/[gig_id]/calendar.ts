import { gigCalendarUrl } from "../../../data/cal.php";

export async function get({ params: { gig_id }, locals: { session } }) {
  console.log(gigCalendarUrl(gig_id, session.userId));
  return { status: 302, headers: { location: gigCalendarUrl(gig_id, session.userId) } };
}
