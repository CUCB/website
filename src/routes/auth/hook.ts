import { Union, Literal, Undefined } from "runtypes";
import crypto from "crypto";
import dotenv from "dotenv";
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

export function get({ headers, context }: { headers: Record<string, string>, context: { session: Session } }) {
  try {
    const mainRole = DefaultRole.Or(Undefined).check(context.session.alternativeRole || context.session.hasuraRole);
    const requestedRole = DefaultRole.Or(Undefined).Or(RequestableRole).check(headers["x-hasura-role"]) || mainRole;

    if (context.session.userId && ["current_user", mainRole].includes(requestedRole)) {
      return {
        status: 200,
        body: {
          "X-Hasura-User-Id": context.session.userId.toString(),
          "X-Hasura-Role": requestedRole,
        }
      };
    } else if (!requestedRole) {
      return {
        status: 200,
        body: {
          "X-Hasura-Role": "anonymous",
        },
      };
    } else if (requestedRole === "server" && headers["session-secret-hash"] === CORRECT_SESSION_SECRET_HASH) {
      return {
        status: 200,
        body: {
          "X-Hasura-Role": "server",
        },
      };
    } else {
      return {
        status: 401,
        body: {
          error: "Not authorized",
        },
      };
    }
  } catch (e) {
    return {
      status: 401,
      body: {
        error: "Invalid role in session",
      },
    };
  }
}
