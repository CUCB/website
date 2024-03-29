import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { login } from "../../../auth";
import { String, Record as RuntypeRecord, Optional } from "runtypes";
import { error } from "@sveltejs/kit";
import type { CookieSerializeOptions } from "cookie";
import { captureException } from "@sentry/node";

const NonEmptyString = String.withConstraint((str) => str.trim().length > 0);
const LoginBody = RuntypeRecord({
  username: NonEmptyString,
  password: NonEmptyString,
  theme: Optional(String),
  redirectTo: Optional(String),
});

export const actions: Actions = {
  default: async ({ request, locals, cookies }) => {
    if ("userId" in locals.session) {
      throw redirect(303, "/members");
    }
    const body = Object.fromEntries(await request.formData());
    if (LoginBody.guard(body)) {
      let loginResult;
      try {
        loginResult = await login(body);
        const session = locals.session as {
          userId: string;
          role: string;
          firstName: string;
          lastName: string;
          theme?: Record<string, string>;
          save(): Promise<[string, string, CookieSerializeOptions] | null>;
        };

        session.userId = loginResult.user_id.toString();
        session.role = loginResult.adminType.role;
        session.firstName = loginResult.first;
        session.lastName = loginResult.last;

        if (body.theme) {
          const theme = JSON.parse(body.theme);
          session.theme = theme?.[session.userId];
        }
        const cookie = await session.save();
        if (cookie) {
          cookies.set(...cookie);
        }
      } catch (e) {
        if (e.status === 401) {
          return fail(401, { username: body.username, message: "Incorrect username or password" });
        } else if (e.status) {
          throw error(e.status, e.message);
        } else {
          captureException(e, { tags: { action: "login" } });
          throw error(500, "Something went wrong");
        }
      }
      throw redirect(303, body.redirectTo || "/members");
    } else {
      return fail(400, { username: body.username, message: "Missing username or password" });
    }
  },
};

export const load: PageServerLoad = async ({ parent }) => {
  const { optionalSession } = await parent();
  if (optionalSession.userId) {
    throw redirect(302, "/members");
  }
};
