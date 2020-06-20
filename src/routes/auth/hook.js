export function get(req, res, next) {
  const mainRole = req.session.alternativeRole || req.session.hasuraRole;
  const requestedRole = req.headers["x-hasura-role"] || mainRole;

  if (
    req.session &&
    req.session.userId &&
    ["current_user", mainRole].includes(requestedRole)
  ) {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        "X-Hasura-User-Id": req.session.userId.toString(),
        "X-Hasura-Role": requestedRole,
      }),
    );
  } else if (!requestedRole) {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        "X-Hasura-Role": "anonymous",
      }),
    );
  } else {
    res.writeHead(401, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        error: "Not authorized",
      }),
    );
  }
}
