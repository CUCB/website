import { randomBytes } from "crypto";
import * as cookie from "cookie";
import { makeGraphqlClient } from "./auth";
import gql from "graphql-tag";
import signature from "cookie-signature";
import dotenv from "dotenv";

dotenv.config();
const SESSION_SECRET = process.env["SESSION_SECRET"];
if (!SESSION_SECRET) {
  console.error("SESSION_SECRET must be set in .env");
  process.exit(1);
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ request, render }) {
  const cookies = cookie.parse(request.headers.cookie || "");
  let session = undefined;
  let sessionId = false;
  if (cookies["connect.sid"]) {
    sessionId = signature.unsign(cookies["connect.sid"], SESSION_SECRET);
  }
  if (sessionId) {
    const client = makeGraphqlClient();
    session = (
      await client.query({
        query: gql`
          query ActiveSession($sid: String!) {
            cucb_session(where: { sid: { _eq: $sid }, expire: { _gt: "now()" } }) {
              sess
            }
          }
        `,
        variables: { sid: sessionId },
      })
    )?.data?.cucb_session[0];
  }

  const setCookie =
    sessionId &&
    !session &&
    cookie.serialize("connect.sid", sessionId, {
      expires: new Date(0), // the epoch - a cookie in the past is expired and will be deleted
      maxAge: 0,
    });

  if (request.path === "/v1/graphql") {
    const response = await fetch("http://graphql-engine:8080/v1/graphql", {
      ...request,
      body: JSON.stringify(request.body),
    });
    const body = await response.text();
    return { status: response.status, body, headers: response.headers };
  }

  const response = await render(request);
  if (setCookie) {
    response.headers = { ...response.headers, "set-cookie": setCookie };
  }

  return response;
}

export async function getContext({ headers }) {
  const cookies = cookie.parse(headers.cookie || "");
  let session = undefined;
  let sessionId = false;
  if (cookies["connect.sid"]) {
    sessionId = signature.unsign(cookies["connect.sid"], SESSION_SECRET);
  }
  const client = makeGraphqlClient();
  if (sessionId) {
    const sessions = (
      await client.query({
        query: gql`
          query ActiveSession($sid: String!) {
            cucb_session(where: { sid: { _eq: $sid }, expire: { _gt: "now()" } }) {
              sess
            }
          }
        `,
        variables: { sid: sessionId },
      })
    )?.data?.cucb_session;
    session = sessions.length && sessions[0].sess;
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
            };
            const setCookie = cookie.serialize("connect.sid", signature.sign(sessionId, SESSION_SECRET), {
              maxAge: 2592000000,
              secure: false,
              httpOnly: true,
              path: "/",
              sameSite: "strict",
            });
            await client.mutate({
              mutation: gql`
                mutation StartSession($sessionId: String!, $sess: json!, $expire: timestamp!, $userId: bigint!) {
                  insert_cucb_session_one(object: { sid: $sessionId, sess: $sess, expire: $expire }) {
                    sid
                  }
                  update_cucb_users_by_pk(pk_columns: { id: $userId }, _set: { last_login_date: "now()" }) {
                    id
                  }
                  delete_cucb_session(where: { expire: { _lte: "now()" } }) {
                    affected_rows
                  }
                }
              `,
              variables: {
                sessionId,
                expire,
                sess,
                userId: sess.userId,
              },
            });
            return { "set-cookie": setCookie };
          } catch (e) {
            console.error(e);
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
          };
          // TODO implement this&
          try {
            let res = await client.mutate({
              mutation: gql`
                mutation UpdateSession($sess: json!, $sessionId: String!) {
                  update_cucb_session_by_pk(pk_columns: { sid: $sessionId }, _set: { sess: $sess }) {
                    sid
                  }
                }
              `,
              variables: {
                sessionId,
                sess,
              },
            });
          } catch (e) {
            console.error(e);
            throw e;
          }
          return {};
        }
      },
      async destroy() {
        if (sessionId) {
          const client = makeGraphqlClient();
          session = (
            await client.mutate({
              mutation: gql`
                mutation DestroySession($sid: String!) {
                  delete_cucb_session_by_pk(sid: $sid) {
                    sid
                  }
                }
              `,
              variables: { sid: sessionId },
            })
          )?.data?.cucb_session;

          const setCookie =
            sessionId &&
            !session &&
            cookie.serialize("connect.sid", sessionId, {
              expires: new Date(0), // the epoch - a cookie in the past is expired and will be deleted
              maxAge: 0,
            });
          return { "set-cookie": setCookie };
        } else {
          // TODO throw exception
        }
      },
    },
  };
}

export async function getSession({ context }) {
  return { ...context.session, save: undefined, destroy: undefined };
}
