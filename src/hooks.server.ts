import { randomBytes } from "crypto";
import signature from "cookie-signature";
import dotenv from "dotenv";
import type { Cookies } from "@sveltejs/kit";
import { Session } from "./lib/entities/Session";
import orm from "./lib/database";
import { User } from "./lib/entities/User";
import { env } from "$env/dynamic/private";

dotenv.config();
const SESSION_SECRET = env["SESSION_SECRET"];
if (!SESSION_SECRET) {
  console.error("SESSION_SECRET must be set in .env");
  process.exit(1);
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const cookies: Cookies = event.cookies;
  let session = undefined;
  let sessionId = "";
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

  event.locals = await sessionFromHeaders(cookies, event.request);

  return await resolve(event);
}

async function sessionFromHeaders(cookies, request: Request) {
  let session = undefined;
  let sessionId = null;
  const em = (await orm()).em.fork();
  const userRepository = em.getRepository(User);
  const sessionRepository = em.getRepository(Session);
  if (cookies.get("connect.sid")) {
    sessionId = signature.unsign(cookies.get("connect.sid"), SESSION_SECRET);
  }

  if (sessionId) {
    session = await sessionRepository.findOne({ sid: sessionId }).then((s) => s?.sess);
  }

  if (!session) {
    sessionId = null;
  }

  return {
    session: {
      ...session,
      cookie: undefined,
      async save() {
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
              hasuraRole: this.hasuraRole,
              theme: this.theme,
              alternativeRole: this.alternativeRole,
            };
            const insert = sessionRepository.nativeInsert({ sid: sessionId, sess, expire });
            const updateLoginDate = userRepository.findOne({ id: this.userId }).then((user) => {
              user.lastLoginDate = new Date();
              return userRepository.persistAndFlush(user);
            });
            const deleteExpiredSessions = sessionRepository.nativeDelete({
              expire: { $lte: new Date() },
            });
            await Promise.all([insert, updateLoginDate, deleteExpiredSessions]);
            return [
              "connect.sid",
              signature.sign(sessionId, SESSION_SECRET),
              {
                // maxAge: 2592000000,
                // secure: false,
                // httpOnly: true,
                path: "/",
                // sameSite: "strict",
              },
            ];
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
            hasuraRole: this.hasuraRole,
            theme: this.theme,
            alternativeRole: this.alternativeRole,
          };
          try {
            const updateSession = sessionRepository.findOne({ sid: sessionId }).then((session) => {
              if (session) {
                session.sess = sess;
                return sessionRepository.persistAndFlush(session);
              } else {
                console.warn(`failed to find session with id ${sessionId} for user ${this.userId}`);
                return sessionRepository.create(sess);
              }
            });
            const deleteExpiredSessions = sessionRepository.nativeDelete({ expire: { $lte: new Date() } });
            await Promise.all([updateSession, deleteExpiredSessions]);
          } catch (e) {
            console.trace(e);
            throw e;
          }
          return [];
        }
      },
      async destroy() {
        if (sessionId) {
          await sessionRepository.nativeDelete({ sid: sessionId });
          return ["connect.sid", { path: "/" }];
        } else {
          // TODO throw exception
          return [];
        }
      },
    },
  };
}

export async function getSession({ locals }) {
  return { ...locals.session, save: undefined, destroy: undefined };
}
