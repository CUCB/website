export function get(req, res, next) {
  if (req.session && req.session.userId) {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        "X-Hasura-User-Id": req.session.userId.toString(),
        "X-Hasura-Role": req.session.hasuraRole,
      }),
    );
  } else {
    res.writeHead(401, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        message: "Not logged in",
      }),
    );
  }
}
