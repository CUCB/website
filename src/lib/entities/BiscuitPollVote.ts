import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { BiscuitPollEntry } from "./BiscuitPollEntry.js";
import type { Relation } from "./bodge.js";
import { User } from "./User.js";

@Entity({ schema: "cucb", tableName: "biscuit_poll_votes" })
export class BiscuitPollVote {
  [OptionalProps]?: "castAt";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @ManyToOne({ entity: () => User, fieldName: "user", index: "idx_17329_user" })
  user!: Relation<User>;

  @Property({ length: 6, defaultRaw: `now()`, type: "timestamptz" })
  castAt!: Date;

  @ManyToOne({ entity: () => BiscuitPollEntry, fieldName: "vote_for", index: "idx_17329_vote_for" })
  voteFor!: BiscuitPollEntry;
}
