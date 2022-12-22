import "reflect-metadata";
import { User } from "../entities/User.js";
import { AuthUserType } from "../entities/AuthUserType.js";
import { List042 } from "../entities/List042.js";
import { Session } from "../entities/Session.js";
import { Committee } from "../entities/Committee.js";
import { CommitteeMember } from "../entities/CommitteeMember.js";
import { CommitteePosition } from "../entities/CommitteePosition.js";
import { CommitteeKey } from "../entities/CommitteeKey.js";
import { CalendarSubscription } from "../entities/CalendarSubscription.js";
import { CalendarSubscriptionType } from "../entities/CalendarSubscriptionType.js";
import { Instrument } from "../entities/Instrument.js";
import { UserInstrument } from "../entities/UserInstrument.js";
import { GigLineupEntry } from "../entities/GigLineupEntry.js";
import { UserPref } from "../entities/UserPref.js";
import { UserPrefType } from "../entities/UserPrefType.js";
import { GigContact } from "../entities/GigContact.js";
import { Gig } from "../entities/Gig.js";
import { AuthActionType } from "../entities/AuthActionType.js";
import { AuthBitmasksPermission } from "../entities/AuthBitmasksPermission.js";
import { Caption } from "../entities/Caption.js";
import { BiscuitPollEntry } from "../entities/BiscuitPollEntry.js";
import { BiscuitPollVote } from "../entities/BiscuitPollVote.js";
import { BiscuitPoll } from "../entities/BiscuitPoll.js";
import { ConnectionType } from "../entities/ConnectionType.js";
import { Contact } from "../entities/Contact.js";
import { Gallery } from "../entities/Gallery.js";
import { GigLineupInstrument } from "../entities/GigLineupInstrument.js";
import { GigType } from "../entities/GigType.js";
import { GigVenue } from "../entities/GigVenue.js";
import { Music } from "../entities/Music.js";
import { MusicType } from "../entities/MusicType.js";
import { News } from "../entities/News.js";
import { SessionTune } from "../entities/SessionTune.js";
import { Song } from "../entities/Song.js";
import { UserInstrumentConnection } from "../entities/UserInstrumentConnections.js";
import { AuthToken } from "../entities/AuthToken.js";
import { dirname, join } from "path";

const makeConfig = (env: Record<string, string | undefined>) => ({
  entities: [
    AuthActionType,
    AuthBitmasksPermission,
    AuthToken,
    AuthUserType,
    BiscuitPoll,
    BiscuitPollEntry,
    BiscuitPollVote,
    CalendarSubscription,
    CalendarSubscriptionType,
    Caption,
    Committee,
    CommitteeMember,
    CommitteePosition,
    CommitteeKey,
    ConnectionType,
    Contact,
    Gallery,
    Gig,
    GigContact,
    GigLineupEntry,
    GigLineupInstrument,
    GigType,
    GigVenue,
    Instrument,
    List042,
    Music,
    MusicType,
    News,
    Session,
    SessionTune,
    Song,
    User,
    UserInstrument,
    UserInstrumentConnection,
    UserPref,
    UserPrefType,
  ],
  dbName: env["PG_DATABASE"],
  type: "postgresql" as const,
  host: env["PG_HOST"],
  user: env["PG_USER"],
  password: env["PG_PASSWORD"],
  migrations: {
    emit: "js" as const,
    path: "./src/migrations",
    pathTs: join(dirname(import.meta.url), "../../migrations")
      .toString()
      .split(":", 2)[1],
    glob: "*.cjs",
  },
});

export default makeConfig;
