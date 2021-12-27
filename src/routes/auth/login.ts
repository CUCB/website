import { login } from "../../auth";
import { String, Record } from "runtypes";
import type { Request } from "@sveltejs/kit";

const NonEmptyString = String.withConstraint((str) => str.trim().length > 0);
const LoginBody = Record({
  username: NonEmptyString,
  password: NonEmptyString,
});
// TODO import an accurate version of this from somewhere!
type Session = any;

export async function post(req: Request<{ session: Session }>) {
  const body = Object.fromEntries(req.body.entries());
  if (LoginBody.guard(body)) {
    try {
      const loginResult = await login(body);

      req.locals.session.userId = loginResult.user_id.toString();
      req.locals.session.hasuraRole = loginResult.admin_type.hasura_role;
      req.locals.session.firstName = loginResult.first;
      req.locals.session.lastName = loginResult.last;
      let setCookie = await req.locals.session.save();
      return { status: 200, body: req.locals.session.userId, headers: setCookie };
    } catch (e) {
      return { status: e.status, body: e.message };
    }
  } else {
    return { status: 400, body: "Missing username or password" };
  }
}
