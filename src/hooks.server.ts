import { randomBytes } from "crypto";
import signature from "cookie-signature";
import dotenv from "dotenv";
import type { Cookies, Handle, HandleServerError } from "@sveltejs/kit";
import { Session } from "./lib/entities/Session";
import orm from "./lib/database";
import { User } from "./lib/entities/User";
import { env } from "$env/dynamic/private";
import type { CookieSerializeOptions } from "cookie";

dotenv.config();
const SESSION_SECRET = env["SESSION_SECRET"];
if (!SESSION_SECRET) {
  console.error("SESSION_SECRET must be set in .env");
  process.exit(1);
}

export const handle: Handle = async ({ event, resolve }) => {
  const cookies: Cookies = event.cookies;
  let session = undefined;
  let sessionId: string | false = "";
  const cookie = cookies.get("connect.sid");
  const sessionRepository = (await orm()).em.fork().getRepository(Session);
  if (cookie) {
    sessionId = signature.unsign(cookie, SESSION_SECRET);
  }
  if (sessionId) {
    session = sessionRepository.findOne({ sid: sessionId });
  }

  if (sessionId && !session) {
    cookies.delete("connect.sid", { path: "/" });
  }

  event.locals = await sessionFromHeaders(cookies);

  return await resolve(event);
};

// export const handleError: HandleServerError = ({ error, event }) => {
//   const errorId = crypto.randomUUID();

// }

async function sessionFromHeaders(cookies: Cookies) {
  let session = undefined;
  let sessionId: string | false = false;
  const em = (await orm()).em.fork();
  const userRepository = em.getRepository(User);
  const sessionRepository = em.getRepository(Session);
  const cookie = cookies.get("connect.sid");
  if (cookie) {
    sessionId = signature.unsign(cookie, SESSION_SECRET);
  }

  if (sessionId) {
    session = await sessionRepository.findOne({ sid: sessionId }).then((s) => s?.sess);
  }

  if (!session) {
    sessionId = false;
  }

  return {
    session: {
      ...session,
      cookie: undefined,
      async save(): Promise<[string, string, CookieSerializeOptions] | null> {
        if (!sessionId) {
          const sessionId = randomBytes(24).toString("base64");
          try {
            const expire = new Date();
            expire.setTime(expire.getTime() + 30 * 24 * 60 * 60 * 1000);
            let sess = {
              cookie: {
                originalMaxAge: 2592000000,
                secure: false,
                httpOnly: true,
                path: "/",
                sameSite: "strict",
              },
              userId: this.userId,
              firstName: this.firstName,
              lastName: this.lastName,
              role: this.role,
              theme: this.theme,
              alternativeRole: this.alternativeRole,
            };
            const insert = sessionRepository.nativeInsert({ sid: sessionId, sess, expire });
            const updateLoginDate = userRepository.findOne({ id: this.userId }).then((user) => {
              if (user) {
                user.lastLoginDate = new Date();
                return userRepository.persistAndFlush(user);
              }
            });
            const deleteExpiredSessions = sessionRepository.nativeDelete({
              expire: { $lte: new Date() },
            });
            await Promise.all([insert, updateLoginDate, deleteExpiredSessions]);
            return ["connect.sid", signature.sign(sessionId, SESSION_SECRET), { path: "/" }];
          } catch (e) {
            throw e;
          }
        } else {
          const sess = {
            cookie: {
              originalMaxAge: 2592000000,
              secure: false,
              httpOnly: true,
              path: "/",
              sameSite: "strict",
            },
            userId: this.userId,
            firstName: this.firstName,
            lastName: this.lastName,
            role: this.role,
            theme: this.theme,
            alternativeRole: this.alternativeRole,
          };
          try {
            const updateSession = sessionRepository.findOne({ sid: sessionId }).then((session) => {
              if (session) {
                session.sess = sess;
                return sessionRepository.persistAndFlush(session);
              } else {
                throw `failed to find session with id ${sessionId} for user ${this.userId}`;
              }
            });
            const deleteExpiredSessions = sessionRepository.nativeDelete({ expire: { $lte: new Date() } });
            await Promise.all([updateSession, deleteExpiredSessions]);
          } catch (e) {
            console.trace(e);
            throw e;
          }
          return null;
        }
      },
      async destroy(): Promise<[string, CookieSerializeOptions] | null> {
        if (sessionId) {
          await sessionRepository.nativeDelete({ sid: sessionId });
          return ["connect.sid", { path: "/" }];
        } else {
          // TODO throw exception
          return null;
        }
      },
    },
  };
}
