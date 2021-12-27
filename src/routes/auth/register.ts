import { createAccount } from "../../auth";
import { EMAIL_PATTERN, CRSID_PATTERN } from "./_register";
import { String, Record as RuntypeRecord } from "runtypes";
import type { Request } from "@sveltejs/kit";

function passwordIsValid(password: string): Boolean {
  return password.length >= 8;
}

// TODO can this be made more precise?
type Session = {
  save(): Promise<Record<string, string>>;
  userId?: string;
  hasuraRole?: string;
  firstName?: string;
  lastName?: string;
};
type PostRequest = Request<{ session: Session }> & { body: FormData };

const RegisterBody = RuntypeRecord({
  username: String,
  password: String,
  passwordConfirm: String,
  firstName: String,
  lastName: String,
});

export async function post(req: PostRequest) {
  const body = Object.fromEntries(req.body.entries());
  try {
    let { username, password, passwordConfirm, firstName, lastName } = RegisterBody.check(body);

    if (username && password === passwordConfirm) {
      let email;
      if (username.match(CRSID_PATTERN)) {
        email = `${username}@cam.ac.uk`;
      } else if (username.match(EMAIL_PATTERN)) {
        if (username.match(/@cam.ac.uk$/)) {
          email = username;
          username = username.replace(/@cam.ac.uk$/, "");
        } else {
          email = username;
        }
      } else {
        return { status: 400, body: "Username is not an email or CRSid" };
      }

      try {
        if (passwordIsValid(password)) {
          const loginResult = await createAccount({ firstName, lastName, username, email, password });

          req.locals.session.userId = loginResult.id.toString();
          req.locals.session.hasuraRole = loginResult.admin_type.hasura_role;
          req.locals.session.firstName = loginResult.first;
          req.locals.session.lastName = loginResult.last;
          let headers = await req.locals.session.save();
          return { status: 200, body: req.locals.session.userId, headers };
        } else {
          return { status: 400, body: "Password must be at least 8 characters long" };
        }
      } catch (e) {
        let { message, status } = e;
        return { status, body: message };
      }
    } else {
      return { status: 400, body: "Missing username, password or name" };
    }
  } catch (e) {
    return { status: 400, body: "Missing username, password or name" };
  }
}
