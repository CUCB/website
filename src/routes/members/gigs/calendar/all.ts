import { allgigsCalendarUrl } from "../../../data/cal.php";

export async function get({ locals: { session } }) {
  return { status: 302, headers: { location: allgigsCalendarUrl(session.userId) } };
}
