import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { User } from "./entities/User";
import { AuthUserType } from "./entities/AuthUserType";
import { List042 } from "./entities/List042";
import { Session } from "./entities/Session";
import { Committee } from "./entities/Committee";
import { CommitteeMember } from "./entities/CommitteeMember";
import { CommitteePosition } from "./entities/CommitteePosition";
import { CommitteeKey } from "./entities/CommitteeKey";
import { CalendarSubscription } from "./entities/CalendarSubscription";
import { CalendarSubscriptionType } from "./entities/CalendarSubscriptionType";
import { Instrument } from "./entities/Instrument";
import { UserInstrument } from "./entities/UsersInstrument";
import { GigLineup } from "./entities/GigLineup";
import { UserPref } from "./entities/UserPref";
import { UserPrefType } from "./entities/UserPrefType";
import { env } from "$env/dynamic/private";

const orm = await MikroORM.init({
  entities: [
    User,
    AuthUserType,
    List042,
    Session,
    Committee,
    CommitteeMember,
    CommitteePosition,
    CommitteeKey,
    CalendarSubscription,
    CalendarSubscriptionType,
    Instrument,
    UserInstrument,
    GigLineup,
    UserPref,
    UserPrefType,
  ],
  dbName: env["PG_DATABASE"],
  type: "postgresql",
  host: env["PG_HOST"],
  user: env["PG_USER"],
  password: env["PG_PASSWORD"],
  migrations: {
    emit: "js",
  },
});
// Create the new migrations, then apply them
// const migrator = orm.getMigrator();
// await migrator.createMigration();
// await migrator.up();

// Export the orm as default
export default orm;
