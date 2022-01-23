import { mygigsCalendarUrl } from "../../../data/cal.php";

export async function get({ locals: { session } }) {
  return { status: 302, headers: { location: mygigsCalendarUrl(session.userId) } };
}
