import { defineConfig } from "cypress";
import { DateTime } from "luxon";
import { makeOrm } from "./src/lib/database/test";
import { Committee } from "./src/lib/entities/Committee";
import { User } from "./src/lib/entities/User";
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
import { loadEnv } from "vite";

const HASHED_PASSWORDS = {
  abc123: "$2b$10$fsfeK3cSN/04rNTVm3dkNuKaaFzo/Xj6HBBzgi1uooabY7XX1vABq",
};

const config = defineConfig({
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
      process.env = loadEnv("development", "", "");

      config.env.POSTGRES_PASSWORD = config.env.POSTGRES_PASSWORD || process.env.POSTGRES_PASSWORD;
      config.env.POSTGRES_HOST = config.env.POSTGRES_HOST || process.env.POSTGRES_HOST;
      config.env.POSTGRES_DATABASE = config.env.POSTGRES_DATABASE || process.env.POSTGRES_DATABASE;
      config.env.POSTGRES_USER = config.env.POSTGRES_USER || process.env.POSTGRES_USER;
      config.env.MAILHOG_HOST = "http://" + (process.env.EMAIL_HOST || "localhost") + ":8025";
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
            // TODO this used to work with upsertMany rather than delete then insert, but it broke in mikro-orm 5.6.16?
            await em.nativeDelete(GigLineupInstrument, {
              $or: entry.user_instruments.map((ui) => ({ ...ui, gig_id: gig_id || entry.gig, user_id: entry.user })),
            });
            await em.insertMany(
              GigLineupInstrument,
              entry.user_instruments.map((ui) => ({
                ...ui,
                gig_id: gig_id || entry.gig,
                user_id: entry.user,
              })),
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
        async "db:instrument_ids_by_name"(): Promise<Record<string, string>> {
          const em = await makeOrm(process.env);
          const instruments = await em.find(Instrument, {});
          const map: Map<string, string> = new Map();
          for (const instrument of instruments) {
            map.set(instrument.name, instrument.id);
          }
          return Object.fromEntries(map.entries());
        },
        async "db:create_gig"(gig: Gig) {
          const em = await makeOrm(process.env);
          if (gig.venue) {
            await em.upsert(GigVenue, gig.venue);
          }
          let { lineup, ...upsertGig } = { ...gig, venue: gig.venue?.id };
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
        async "db:instruments_for_user"(user) {
          const em = await makeOrm(process.env);
          return await em.find(UserInstrument, { user }, { populate: ["instrument"] });
        },
        async "db:clear_lineup_for_gig"(gig) {
          const em = await makeOrm(process.env);
          await em.nativeDelete(GigLineupEntry, { gig });
          await em.nativeDelete(GigLineupInstrument, { gig_id: gig });
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
