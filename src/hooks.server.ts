import { randomBytes } from "crypto";
import signature from "cookie-signature";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { error } from "@sveltejs/kit";
// If we don't import Response somewhere, we get a "Response is not defined" error every time
// we call fetch when server-side rendering, so we import it here.
// TODO is this needed now
// @ts-ignore
import type { Response } from "isomorphic-fetch";
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
  const sessionRepository = orm.em.fork().getRepository(Session);
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
  const em = orm.em.fork();
  const userRepository = em.getRepository(User);
  const sessionRepository = em.getRepository(Session);
  if (cookies.get("connect.sid")) {
    sessionId = signature.unsign(cookies.get("connect.sid"), SESSION_SECRET);
  } else {
    // Allow JWTs to access the site so the calendar endpoints can make graphql queries
    if (request.headers.get("authorization")?.startsWith("Bearer ")) {
      try {
        const token = jwt.verify(request.headers.get("authorization").slice("Bearer ".length), SESSION_SECRET);
        const hasuraRole = await userRepository
          .findOne({ id: parseInt(token.userId) })
          .then((user) => user?.adminType.hasuraRole);
        if (hasuraRole) {
          session = { userId: parseInt(token.userId), hasuraRole };
        }

        // TODO possible error handling/logging
      } catch (e) {
        console.error(e);
        throw error(500, "Failed to authenticate iCal request");
        // TODO maybe handle errors like we do for password reset?
      }
    }
  }

  if (sessionId) {
    session = await sessionRepository.findOne({ sid: sessionId }).then((s) => s?.sess);
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
            const deleteExpiredSessions = sessionRepository.nativeDelete({ expire: { $lte: new Date() } });
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
            // console.error(e);
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
                console.warn(`session with id ${sessionId} for user ${this.userId}`);
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

export async function handleFetch({ event, request, fetch }) {
  if (request.url.startsWith(env["GRAPHQL_REMOTE"])) {
    request.headers.set("cookie", event.request.headers.get("cookie"));
    request.headers.set("authorization", event.request.headers.get("authorization"));
    for (const [header, value] of event.request.headers) {
      if (["cookie", "authorization", "host"].includes(header)) continue;
      request.headers.set(header, value);
    }
  }

  return fetch(request);
}

export async function getSession({ locals }) {
  return { ...locals.session, save: undefined, destroy: undefined };
}
