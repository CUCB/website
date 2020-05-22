import sirv from "sirv";
import polka from "polka";
import compression from "compression";
import * as sapper from "@sapper/server";
import session from "express-session";
import dotenv from "dotenv";
import { pool } from "./auth";
import bodyParser from "body-parser";
import httpProxy from "http-proxy";

// Get the environment variables from the .env file
dotenv.config();

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === "development";

// Fetch these seperately, as rollup will replace them from .env
// and we want the server to be consistent with the client
const GRAPHQL_REMOTE = process.env.GRAPHQL_REMOTE;
const GRAPHQL_PATH = process.env.GRAPHQL_PATH;

const pgSession = require("connect-pg-simple")(session);
const apiProxy = httpProxy.createProxyServer();
apiProxy.on("error", function(err, req, res) {
  res.writeHead(500, {
    "Content-Type": "text/plain",
  });

  res.end("Something went wrong connecting to Hasura.");
});

if (!process.env.SESSION_SECRET) {
  console.error("Please provide a SESSION_SECRET in .env");
  process.exit(1);
}

polka()
  .all(`${GRAPHQL_PATH}`, function(req, res) {
    apiProxy.web(req, res, { target: GRAPHQL_REMOTE });
  })
  .use(
    compression({ threshold: 0 }),
    sirv("static", { dev }),
    bodyParser.urlencoded({ extended: true }),
    session({
      store: new pgSession({
        pool: pool(),
        schemaName: "cucb",
      }),
      saveUninitialized: false,
      resave: true,
      secret: process.env.SESSION_SECRET,
      cookie: { maxAge: 30 * 24 * 60 * 6000 },
    }),
    sapper.middleware({
      session: (req, res) => {
        res.setHeader("cache-control", "no-cache, no-store");
        return {
          userId: req.session.userId,
          firstName: req.session.firstName,
          lastName: req.session.lastName,
          hasuraRole: req.session.hasuraRole,
        };
      },
    }),
  )
  .listen(PORT, err => {
    if (err) console.log("error", err);
  });
