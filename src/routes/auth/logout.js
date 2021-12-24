export async function post(req, res, next) {
  if (req.session) {
    req.session.destroy(() => {
      res.statusCode = 204;
      res.end();
    });
  } else {
    res.statusCode = 401;
    res.end("Not logged in");
  }
}
