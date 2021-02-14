import { createAccount } from "../../auth";

function checkPassword(password) {
    return password.length >= 8;
}

export async function post(req, res, next) {
  const { username, email, password, confirmPassword, firstName, lastName } = req.body;

  if (username && email && password === confirmPassword) {
    try {
      checkPassword(password);
      const loginResult = await createAccount({ username, email, password });

      req.session.userId = loginResult.user_id;
      req.session.hasuraRole = loginResult.hasura_role;
      req.session.firstName = loginResult.first;
      req.session.lastName = loginResult.last;
      req.session.save(
        () => (res.statusCode = 200),
        res.end(req.session.userId),
      );
    } catch (e) {
      res.statusCode = 401;
      res.end("Incorrect username or password");
    }
  } else {
    res.statusCode = 400;
    res.end("Missing username, email, password or name");
  }
}
