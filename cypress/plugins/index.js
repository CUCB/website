// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
import dotenv from "dotenv";
dotenv.config();

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  config.env.PG_PASSWORD = config.env.PG_PASSWORD || process.env.PG_PASSWORD;
  config.env.PG_HOST = config.env.PG_HOST || process.env.PG_HOST;
  config.env.PG_DATABASE = config.env.PG_DATABASE || process.env.PG_DATABASE;
  config.env.PG_USER = config.env.PG_USER || process.env.PG_USER;
  (config.env.GRAPHQL_REMOTE = process.env.GRAPHQL_REMOTE || "http://localhost:8080"),
    (config.env.GRAPHQL_PATH = process.env.GRAPHQL_PATH || "/v1/graphql");
  config.env.MAILHOG_HOST = "http://" + (process.env.EMAIL_POSTFIX_HOST || "localhost") + ":8025";
  config.env.HASURA_GRAPHQL_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || "myadminsecretkey";
  config.env.SESSION_SECRET = process.env.SESSION_SECRET || "somethingrandom";

  return config;
};
