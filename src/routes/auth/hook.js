import crypto from "crypto";
const CORRECT_SESSION_SECRET_HASH = crypto.createHash("sha512", process.env.SESSION_SECRET).digest("hex");

export function get(req, res, next) {
  const mainRole = req.session.alternativeRole || req.session.hasuraRole;
  const requestedRole = req.headers["x-hasura-role"] || mainRole;

  if (req.session && req.session.userId && ["current_user", mainRole].includes(requestedRole)) {
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
  } else if (req.headers["session-secret-hash"] === CORRECT_SESSION_SECRET_HASH) {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        "X-Hasura-Role": "server",
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
