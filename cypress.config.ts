import { defineConfig } from "cypress";
import dotenv from "dotenv";
import { DateTime } from "luxon";
import { makeOrm } from "./src/lib/database/test";
import { Committee } from "./src/lib/entities/Committee";
import { User } from "./src/lib/entities/User";
import { HASHED_PASSWORDS } from "./cypress/database/users";
import { CommitteeMember } from "./src/lib/entities/CommitteeMember";
import { List042 } from "./src/lib/entities/List042";
import { Gig } from "./src/lib/entities/Gig";
import { GigVenue } from "./src/lib/entities/GigVenue";
import { GigLineupEntry } from "./src/lib/entities/GigLineupEntry";
import { UserInstrument } from "./src/lib/entities/UserInstrument";
import { GigLineupInstrument } from "./src/lib/entities/GigLineupInstrument";
import { Contact } from "./src/lib/entities/Contact";
import { UserPrefType } from "./src/lib/entities/UserPrefType";
import { Instrument } from "./src/lib/entities/Instrument";
import { UserPref } from "./src/lib/entities/UserPref";
import { GigType } from "./src/lib/entities/GigType";
dotenv.config();

const config = defineConfig({
  video: true,
  projectId: "u67py9",
  defaultCommandTimeout: 4000,
  chromeWebSecurity: false,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  pageLoadTimeout: 600000,
  experimentalStudio: true,
  e2e: {
    setupNodeEvents(on, config) {
      config.env.PG_PASSWORD = config.env.PG_PASSWORD || process.env.PG_PASSWORD;
      config.env.PG_HOST = config.env.PG_HOST || process.env.PG_HOST;
      config.env.PG_DATABASE = config.env.PG_DATABASE || process.env.PG_DATABASE;
      config.env.PG_USER = config.env.PG_USER || process.env.PG_USER;
      (config.env.GRAPHQL_REMOTE = process.env.GRAPHQL_REMOTE || "http://localhost:8080"),
        (config.env.GRAPHQL_PATH = process.env.GRAPHQL_PATH || "/v1/graphql");
      config.env.MAILHOG_HOST = "http://" + (process.env.EMAIL_HOST || "localhost") + ":8025";
      config.env.HASURA_GRAPHQL_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || "myadminsecretkey";
      config.env.SESSION_SECRET = process.env.SESSION_SECRET || "somethingrandom";

      const addGigLineup = async (em, entries, gig_id) => {
        for (const entry of entries) {
          if (typeof entry.user !== "string") {
            const insertUser = { ...entry.user };
            delete insertUser["instruments"];
            delete insertUser["prefs"];
            await em.upsert(User, insertUser);
            if (typeof entry.user?.instruments?.[0] === "object") {
              await em.upsertMany(
                UserInstrument,
                entry.user.instruments.map((ui) => ({ ...ui, user: entry.user.id })),
              );
            }
            if (typeof entry.user?.prefs?.[0] === "object") {
              await em.upsertMany(
                UserPref,
                entry.user.prefs.map((pref) => ({ ...pref, user: entry.user.id })),
              );
            }
            entry.user = entry.user.id;
          }
          const insertEntry = { gig: gig_id, ...entry, user: entry.user };
          delete insertEntry["user_instruments"];
          await em.upsert(GigLineupEntry, insertEntry);
          if (entry.user_instruments) {
            await em.upsertMany(
              GigLineupInstrument,
              entry.user_instruments.map((ui) => ({ ...ui, gig_id: gig_id || entry.gig, user_id: entry.user })),
            );
          }
        }
      };

      on("task", {
        async "db:create_custom_users"(users) {
          const em = await makeOrm(process.env);
          const instrumentss = users.map((user) => [user.instruments, user.id]).filter((i) => i[0]);
          const prefss = users.map((user) => [user.prefs, user.id]).filter((p) => p[0]);

          await em.upsertMany(
            User,
            users.map((user) => {
              const copy = { ...user };
              delete copy["instruments"];
              delete copy["prefs"];
              return copy;
            }),
          );

          for (const [instruments, user] of instrumentss) {
            await em.upsertMany(
              UserInstrument,
              instruments.map((i) => ({ ...i, user })),
            );
          }
          for (const [prefs, user] of prefss) {
            await em.upsertMany(
              UserPref,
              prefs.map((p) => ({ ...p, user })),
            );
          }
          return null;
        },
        async "db:delete_users_where"(where) {
          const em = await makeOrm(process.env);
          await em.nativeDelete(User, where);
          return null;
        },
        async "db:update_user"([id, { joinDate, lastLoginDate }]) {
          const em = await makeOrm(process.env);
          await em.nativeUpdate(
            User,
            { id },
            {
              joinDate: joinDate && DateTime.fromISO(joinDate).toJSDate(),
              lastLoginDate: lastLoginDate && DateTime.fromISO(lastLoginDate).toJSDate(),
            },
          );
          return null;
        },
        async "db:delete_from_list042"(where) {
          const em = await makeOrm(process.env);
          await em.nativeDelete(List042, where);
          return null;
        },
        async "db:append_to_list042"(emails) {
          const em = await makeOrm(process.env);
          await em.upsertMany(
            List042,
            emails.map((email) => ({ email })),
          );
          return null;
        },
        async "db:update_gig_type"({ id, type }) {
          const em = await makeOrm(process.env);
          await em.nativeUpdate(Gig, { id }, { type });
          return null;
        },
        async "db:all_gig_types"(where) {
          const em = await makeOrm(process.env);
          const types = await em.find(GigType, where);
          return types;
        },
        async "db:delete_signups"(gig) {
          const em = await makeOrm(process.env);
          await em.nativeDelete(GigLineupEntry, { gig });
          return null;
        },
        async "db:create_login_users"() {
          const em = await makeOrm(process.env);
          await em.upsert(User, {
            id: "27250",
            username: "cypress_user",
            saltedPassword: HASHED_PASSWORDS.abc123,
            adminType: "9",
            email: "cypress.user@cypress.io",
            first: "Cypress",
            last: "User",
          });
          await em.upsert(User, {
            id: "27382",
            username: "cypress_president",
            saltedPassword: HASHED_PASSWORDS.abc123,
            adminType: "2",
            email: "cypress.president@cypress.io",
            first: "Cypress",
            last: "President",
          });
          await em.upsert(User, {
            id: "32747",
            username: "cypress",
            saltedPassword: HASHED_PASSWORDS.abc123,
            adminType: "1",
            email: "cypress.webmaster@cypress.io",
            first: "Cypress",
            last: "Webmaster",
          });
          return null;
        },
        async "db:delete_signup"({ gig_id, user_id }) {
          const em = await makeOrm(process.env);
          await em.nativeDelete(GigLineupEntry, { gig: gig_id, user: user_id });
          return null;
        },
        async "db:delete_instruments_for_user"(user_id) {
          const em = await makeOrm(process.env);
          await em.nativeDelete(GigLineupInstrument, { user_id });
          await em.nativeDelete(UserInstrument, { user: user_id });
          return null;
        },
        async "db:create_user_instrument"(instrument) {
          const em = await makeOrm(process.env);
          await em.upsert(UserInstrument, instrument);
          return null;
        },
        async "db:create_committee"() {
          const em = await makeOrm(process.env);
          await em.upsert(Committee, {
            id: "57434",
            started: DateTime.fromISO("1970-01-01T01:00Z").toJSDate(),
          });
          await em.upsert(CommitteeMember, {
            committee: "57434",
            id: "17547",
            position: "1",
            name: "Leady Lead",
            casual_name: "Leady",
            lookup_name: "1",
          });
          return null;
        },
        async "db:attribute_ids_by_name"() {
          const em = await makeOrm(process.env);
          const attributes = await em.find(UserPrefType, { name: { $like: "attribute.%" } });
          const map = new Map();
          for (const attribute of attributes) {
            map.set(attribute.name.split(".")[1], attribute.id);
          }
          return Object.fromEntries(map.entries());
        },
        async "db:instrument_ids_by_name"() {
          const em = await makeOrm(process.env);
          const instruments = await em.find(Instrument, {});
          const map = new Map();
          for (const instrument of instruments) {
            map.set(instrument.name, instrument.id);
          }
          return Object.fromEntries(map.entries());
          return new Promise((resolve, reject) => {
            makeOrm(process.env)
              .then((em) => em.find(Instrument, {}))
              .then((instruments) => {
                const map = new Map();
                for (const instrument of instruments) {
                  map.set(instrument.name, instrument.id);
                }
                resolve(Object.fromEntries(map.entries()));
              })
              .catch(reject);
          });
        },
        async "db:create_gig"(gig: Gig) {
          const em = await makeOrm(process.env);
          if (gig.venue) {
            await em.upsert(GigVenue, gig.venue);
          }
          let upsertGig = { ...gig, venue: gig.venue?.id };
          delete upsertGig["lineup"];
          await em.upsert(Gig, upsertGig);
          if (gig.lineup) {
            await addGigLineup(em, gig.lineup, gig.id);
          }
          return null;
        },
        async "db:delete_gig"(id: string) {
          const em = await makeOrm(process.env);
          await em.nativeDelete(Gig, { id });
          return null;
        },
        async "db:create_lineup"({ entries, gig }) {
          const em = await makeOrm(process.env);
          addGigLineup(em, entries, gig);
          return null;
        },
        async "db:delete_contacts"(where) {
          const em = await makeOrm(process.env);
          await em.nativeDelete(Contact, where);
          return null;
        },
        async "db:delete_venues"(where) {
          const em = await makeOrm(process.env);
          await em.nativeDelete(GigVenue, where);
          return null;
        },
        async "db:create_venues"(venues) {
          const em = await makeOrm(process.env);
          await em.upsertMany(GigVenue, venues);
          return null;
        },
        async "db:create_contacts"(contacts) {
          const em = await makeOrm(process.env);
          await em.upsertMany(Contact, contacts);
          return null;
        },
      });

      return config;
    },
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.{js,jsx,ts,tsx}",
    experimentalRunAllSpecs: true,
  },
});

export default config;
