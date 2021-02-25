import crypto from "crypto";
import type { SapperRequest, SapperResponse } from "@sapper/server";
import type { Next } from "polka";
import { Union, Literal, Undefined } from "runtypes";
const CORRECT_SESSION_SECRET_HASH = crypto
  .createHash("sha512")
  .update(Buffer.from(process.env.SESSION_SECRET as string))
  .digest("hex");

// TODO centralise this stuff!!
// TODO check this list is actually correct
const DefaultRole = Union(
  Literal("webmaster"),
  Literal("president"),
  Literal("secretary"),
  Literal("treasurer"),
  Literal("equipment"),
  Literal("gig_editor"),
  Literal("music_only"),
  Literal("general_member"),
  Literal("blue_gig"),
  Literal("user"),
);

interface Session {
  alternativeRole?: string;
  hasuraRole?: string;
  userId?: number;
}

const RequestableRole = Union(Literal("server"), Literal("current_user"));

export function get(req: SapperRequest & { session: Session }, res: SapperResponse, next: Next) {
  try {
    const mainRole = DefaultRole.Or(Undefined).check(req.session.alternativeRole || req.session.hasuraRole);
    const requestedRole = DefaultRole.Or(Undefined).Or(RequestableRole).check(req.headers["x-hasura-role"]) || mainRole;

    if (req.session.userId && ["current_user", mainRole].includes(requestedRole)) {
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
    } else if (requestedRole === "server" && req.headers["session-secret-hash"] === CORRECT_SESSION_SECRET_HASH) {
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
  } catch (e) {
    res.writeHead(401, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        error: "Invalid role in session",
      }),
    );
  }
}
