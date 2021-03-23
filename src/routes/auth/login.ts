import { login } from "../../auth";
import type { SapperRequest, SapperResponse } from "@sapper/server";
import { String, Record } from "runtypes";

const NonEmptyString = String.withConstraint((str) => str.trim().length > 0);
const LoginBody = Record({
  username: NonEmptyString,
  password: NonEmptyString,
});
// TODO import an accurate version of this from somewhere!
type Session = any;

export async function post(req: SapperRequest & { body: any; session: Session }) {
  const body = Object.fromEntries(req.body.entries());
  if (LoginBody.guard(body)) {
    try {
      const loginResult = await login(body);

      req.context.session.userId = loginResult.user_id.toString();
      req.context.session.hasuraRole = loginResult.admin_type.hasura_role;
      req.context.session.firstName = loginResult.first;
      req.context.session.lastName = loginResult.last;
      let setCookie = await req.context.session.save();
      return { status: 200, body: req.context.session.userId, headers: setCookie };
    } catch (e) {
      return { status: e.status, body: e.message };
    }
  } else {
    return { status: 400, body: "Missing username or password" };
  }
}
