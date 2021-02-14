import { login } from "../../auth";

export async function post(req, res, next) {
  const { username, password } = req.body;

  if (username && password) {
    try {
      const loginResult = await login({ username, password });

      req.session.userId = loginResult.user_id.toString();
      req.session.hasuraRole = loginResult.admin_type.hasura_role;
      req.session.firstName = loginResult.first;
      req.session.lastName = loginResult.last;
      req.session.save(() => (res.statusCode = 200), res.end(req.session.userId));
    } catch (e) {
      // TODO better error handling here in case something on the server is not right
      console.error(e)
      res.statusCode = 401;
      res.end("Incorrect username or password");
    }
  } else {
    res.statusCode = 400;
    res.end("Missing username or password");
  }
}
