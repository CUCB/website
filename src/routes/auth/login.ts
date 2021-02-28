import { login } from "../../auth";
import type { SapperRequest, SapperResponse } from "@sapper/server";
import type { Next } from "polka";
import { String, Record } from "runtypes";

const NonEmptyString = String.withConstraint(str => str.trim().length > 0)
const LoginBody = Record({
    username: NonEmptyString,
    password: NonEmptyString
});
// TODO import an accurate version of this from somewhere!
type Session = any;

export async function post(req: SapperRequest & { body: any, session: Session }, res: SapperResponse, next: Next) {
  if (LoginBody.guard(req.body)) {
    try {
      const loginResult = await login(req.body);

      req.session.userId = loginResult.user_id.toString();
      req.session.hasuraRole = loginResult.admin_type.hasura_role;
      req.session.firstName = loginResult.first;
      req.session.lastName = loginResult.last;
      req.session.save(() => (res.statusCode = 200), res.end(req.session.userId));
    } catch (e) {
      res.statusCode = e.status;
      res.end(e.message);
    }
  } else {
    res.statusCode = 400;
    res.end("Missing username or password");
  }
}
