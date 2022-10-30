import { invalid, redirect } from "@sveltejs/kit";
import type { Actions } from "@sveltejs/kit";
import { login } from "../../../auth";
import { String, Record } from "runtypes";
import { error } from "@sveltejs/kit";

const NonEmptyString = String.withConstraint((str) => str.trim().length > 0);
const LoginBody = Record({
  username: NonEmptyString,
  password: NonEmptyString,
});

export const actions: Actions = {
  default: async ({ request, locals, cookies }) => {
    const body = Object.fromEntries(await request.formData());
    if (LoginBody.guard(body)) {
      try {
        const loginResult = await login(body);

        locals.session.userId = loginResult.user_id.toString();
        locals.session.hasuraRole = loginResult.admin_type.hasura_role;
        locals.session.firstName = loginResult.first;
        locals.session.lastName = loginResult.last;
        if (body.theme) {
          locals.session.theme = body.theme;
        }
        let [name, value, opts] = await locals.session.save();
        cookies.set(name, value, opts);
      } catch (e) {
        if (e.status === 401) {
          return invalid(401, { username: body.username, message: "Incorrect username or password" });
        }
        throw error(e.status, e.message);
      }
      throw redirect(303, "/members");
    } else {
      return invalid(400, { username: body.username, message: "Missing username or password" });
    }
  },
};
