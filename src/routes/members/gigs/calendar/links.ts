import { notLoggedIn } from "../../../../client-auth";
import { mygigsCalendarUrl, allgigsCalendarUrl } from "../../../data/cal.php";

export async function get({ locals: { session } }) {
  const loginFail = notLoggedIn(session);
  if (loginFail) return loginFail;
  return {
    status: 200,
    body: {
      allgigs: allgigsCalendarUrl(session.userId),
      mygigs: mygigsCalendarUrl(session.userId),
    },
  };
}
