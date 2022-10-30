import { createAccount } from "../../../auth";
import { EMAIL_PATTERN, CRSID_PATTERN } from "../_register";
import { String, Record as RuntypeRecord } from "runtypes";
import { error } from "@sveltejs/kit";

function passwordIsValid(password: string): Boolean {
  return password.length >= 8;
}

const RegisterBody = RuntypeRecord({
  username: String,
  password: String,
  passwordConfirm: String,
  firstName: String,
  lastName: String,
});

export async function POST({ request, cookies }) {
  const body = Object.fromEntries(await request.formData());
  let checkedBody;
  try {
    checkedBody = RegisterBody.check(body);
  } catch (e) {
    throw error(400, "Missing username, password or name");
  }
  let { username, password, passwordConfirm, firstName, lastName } = checkedBody;

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

    if (passwordIsValid(password)) {
      try {
        const loginResult = await createAccount({ firstName, lastName, username, email, password });

        request.locals.session.userId = loginResult.id.toString();
        request.locals.session.hasuraRole = loginResult.admin_type.hasura_role;
        request.locals.session.firstName = loginResult.first;
        request.locals.session.lastName = loginResult.last;
        const cookie = await request.locals.session.save();
        cookies.set(...cookie);
        return new Response(request.locals.session.userId);
      } catch (e) {
        let { message, status } = e;
        throw error(status, message);
      }
    } else {
      throw error(400, "Password must be at least 8 characters long");
    }
  } else {
    throw error(400, "Missing username, password or name");
  }
}
