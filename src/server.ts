import sirv from "sirv";
import polka from "polka";
import compression from "compression";
import * as sapper from "@sapper/server";
import session from "express-session";
import dotenv from "dotenv";
import { Pool } from "pg";
import bodyParser from "body-parser";
import httpProxy from "http-proxy";
import { simpleParser } from "mailparser";
import fetch from "node-fetch";
import { Record, Function, Undefined, String } from "runtypes";

// TODO put this only in one place
const Session = Record({
  save: Function,
  userId: String.Or(Undefined),
  hasuraRole: String.Or(Undefined),
  firstName: String.Or(Undefined),
  lastName: String.Or(Undefined),
  theme: String.Or(Undefined),
});

const AuthenticatedRequest = Record({
  session: Session
});

// Get the environment variables from the .env file
dotenv.config();

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === "development";
const test = NODE_ENV === "test";

// Fetch these seperately, as rollup will replace them from .env at build time
// and we want the server to be consistent with the client
const GRAPHQL_REMOTE = process.env.GRAPHQL_REMOTE;
const GRAPHQL_PATH = process.env.GRAPHQL_PATH;

const pgSession = require("connect-pg-simple")(session);
const apiProxy = httpProxy.createProxyServer();
apiProxy.on("error", function (err, req, res) {
  res.writeHead(500, {
    "Content-Type": "text/plain",
  });

  res.end("Something went wrong connecting to Hasura.");
});

if (!process.env.SESSION_SECRET) {
  console.error("Please provide a SESSION_SECRET in .env");
  process.exit(1);
}

// Host static only on dev server
const server =
  dev || test
    ? polka()
        .use("/images/committee", sirv("static/static/images/committee", { dev }))
        .use(sirv("static", { dev }))
        .use("/renderemail", async function (req, res) {
          const id = req.query["id"];
          try {
            const email = await fetch(`http://${process.env.EMAIL_POSTFIX_HOST}:8025/api/v1/messages/${id}/download`);
            res.writeHead(200, { "Content-Type": "text/html" });
            const parsed = await simpleParser(await email.text());
            res.end(parsed.html || parsed.textAsHtml);
          } catch (e) {
            res.writeHead(404, { "Content-Type": "text/text" });
            res.end(`Not found. Or some other error: ${e}`);
          }
        })
    : polka().use(sirv("static", { dev }));

server
  .all(`${GRAPHQL_PATH}`, function (req, res) {
    apiProxy.web(req, res, { target: GRAPHQL_REMOTE });
  })
  .use(
    compression({ threshold: 0 }),
    bodyParser.urlencoded({ extended: true }),
    session({
      store: new pgSession({
        pool: new Pool({
          user: process.env.PG_USER,
          host: process.env.PG_HOST,
          database: process.env.PG_DATABASE,
          password: process.env.PG_PASSWORD,
          port: parseInt(process.env.PG_PORT as string),
          max: 5,
        }),
        schemaName: "cucb",
      }),
      saveUninitialized: false,
      resave: true,
      secret: process.env.SESSION_SECRET,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "strict",
        // secure=false because I'm really struggling to get this to work on the server
        // It's probably something to do with reverse-proxying, and when it's broken no one can log in
        // Might be worth looking at if relevant when upgrading to SvelteKit
        secure: false,
      },
    }),
    sapper.middleware({
      session: (req, res) => {
        res.setHeader("cache-control", "no-cache, no-store");
        // if (AuthenticatedRequest.guard(req)) {
          return {
              //@ts-ignore
            userId: req.session.userId,
              //@ts-ignore
            firstName: req.session.firstName,
              //@ts-ignore
            lastName: req.session.lastName,
              //@ts-ignore
            hasuraRole: req.session.hasuraRole,
              //@ts-ignore
            theme: req.session.theme,
          };
        // } else {
        //   return {};
        // }
      },
    }),
  )
  .listen(PORT, (err: unknown) => {
    if (err) console.error("error", err);
  });
