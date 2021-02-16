import { createAccount } from "../../auth";
export const EMAIL_PATTERN = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;
export const CRSID_PATTERN = /^[A-z]{2,6}[0-9]{1,6}$/;

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
