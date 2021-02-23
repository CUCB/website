import { createAccount } from "../../auth";
import { EMAIL_PATTERN, CRSID_PATTERN } from "./_register";

function passwordIsValid(password) {
  return password.length >= 8;
}

export async function post(req, res, next) {
  try {
    let { username, password, passwordConfirm, firstName, lastName } = req.body;

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
      }

      try {
        if (passwordIsValid(password)) {
          const loginResult = await createAccount({ firstName, lastName, username, email, password });

          req.session.userId = loginResult.id.toString();
          req.session.hasuraRole = loginResult.admin_type.hasura_role;
          req.session.firstName = loginResult.first;
          req.session.lastName = loginResult.last;
          req.session.save(() => (res.statusCode = 200), res.end(req.session.userId));
        } else {
          res.statusCode = 400;
          res.end("Password must be at least 8 characters long");
        }
      } catch (e) {
        let { message, status } = e;
        res.statusCode = status;
        res.end(message);
      }
    } else {
      res.statusCode = 400;
      res.end("Missing username, password or name");
    }
  } catch (e) {
    res.statusCode = 400;
    res.end("Missing username, password or name");
  }
}
