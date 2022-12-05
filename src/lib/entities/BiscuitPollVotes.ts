import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { BiscuitPollEntries } from "./BiscuitPollEntries.js";
import { User } from "./User";

@Entity({ schema: "cucb" })
export class BiscuitPollVotes {
  [OptionalProps]?: "castAt";

  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @ManyToOne({ entity: () => Users, fieldName: "user", index: "idx_17329_user" })
  user!: Users;

  @Property({ length: 6, defaultRaw: `now()` })
  castAt!: Date;

  @ManyToOne({ entity: () => BiscuitPollEntries, fieldName: "vote_for", index: "idx_17329_vote_for" })
  voteFor!: BiscuitPollEntries;
}
