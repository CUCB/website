import { Union, Literal, Undefined, Null } from "runtypes";
import crypto from "crypto";
import dotenv from "dotenv";
import { json } from "@sveltejs/kit";
dotenv.config();
const CORRECT_SESSION_SECRET_HASH = crypto
  .createHash("sha512")
  .update(Buffer.from(process.env["SESSION_SECRET"] as string))
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

export function GET({ request, locals }: { request: Request; locals: { session: Session } }) {
  try {
    const mainRole = DefaultRole.Or(Undefined).check(locals.session.alternativeRole || locals.session.hasuraRole);
    const requestedRole =
      DefaultRole.Or(Null).Or(RequestableRole).check(request.headers.get("x-hasura-role")) || mainRole;

    if (locals.session.userId && ["current_user", mainRole].includes(requestedRole)) {
      return json({
        "X-Hasura-User-Id": locals.session.userId.toString(),
        "X-Hasura-Role": requestedRole,
      });
    } else if (!requestedRole) {
      return json({
        "X-Hasura-Role": "anonymous",
      });
    } else if (
      requestedRole === "server" &&
      request.headers.get("session-secret-hash") === CORRECT_SESSION_SECRET_HASH
    ) {
      return json({
        "X-Hasura-Role": "server",
      });
    } else if (
      request.headers.get("session-secret-hash") === CORRECT_SESSION_SECRET_HASH &&
      request.headers.get("x-hasura-user-id") !== null
    ) {
      return json({
        "X-Hasura-User-Id": request.headers.get("x-hasura-user-id"),
        "X-Hasura-Role": request.headers.get("x-hasura-role"),
      });
    } else {
      return json(
        {
          error: "Not authorized",
        },
        { status: 401 },
      );
    }
  } catch (e) {
    console.log(e);
    return json(
      {
        error: "Invalid role in session",
      },
      { status: 401 },
    );
  }
}
