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

export async function POST({ request, cookies, locals }) {
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

        locals.session.userId = loginResult.id.toString();
        locals.session.hasuraRole = loginResult.adminType.hasura_role;
        locals.session.firstName = loginResult.first;
        locals.session.lastName = loginResult.last;
        const cookie = await locals.session.save();
        cookies.set(...cookie);
        return new Response(locals.session.userId);
      } catch (e) {
        if (e.message) {
          let { message, status } = e;
          throw error(status, message);
        } else {
          console.trace(e);
          throw error(500, "Internal error");
        }
      }
    } else {
      throw error(400, "Password must be at least 8 characters long");
    }
  } else {
    throw error(400, "Missing username, password or name");
  }
}
