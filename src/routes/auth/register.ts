import { createAccount } from "../../auth";
import { EMAIL_PATTERN, CRSID_PATTERN } from "./_register";
import type { SapperRequest, SapperResponse } from "@sapper/server";
import { String, Record } from "runtypes";

function passwordIsValid(password: string): Boolean {
  return password.length >= 8;
}

// TODO can this be made more precise?
type Session = {
  save: (callback: () => void) => void;
  userId?: string;
  hasuraRole?: string;
  firstName?: string;
  lastName?: string;
};
type PostRequest = SapperRequest & { body: object; session: Session };

const RegisterBody = Record({
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

          req.context.session.userId = loginResult.id.toString();
          req.context.session.hasuraRole = loginResult.admin_type.hasura_role;
          req.context.session.firstName = loginResult.first;
          req.context.session.lastName = loginResult.last;
          let headers = await req.context.session.save();
          return { status: 200, body: req.context.session.userId, headers };
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
