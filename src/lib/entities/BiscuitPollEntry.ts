import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { BiscuitPoll } from "./BiscuitPoll.js";
import type { Relation } from "./bodge.js";
import { User } from "./User.js";

@Entity({ schema: "cucb", tableName: "biscuit_poll_entries" })
export class BiscuitPollEntry {
  [OptionalProps]?: "addedAt";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 255, type: "varchar" })
  name!: string;

  @ManyToOne({ entity: () => BiscuitPoll, fieldName: "poll", index: "idx_17322_poll" })
  poll!: BiscuitPoll;

  @Property({ length: 6, defaultRaw: `now()`, type: "timestamptz" })
  addedAt!: Date;

  @ManyToOne({ entity: () => User, fieldName: "added_by", index: "idx_17322_added_by" })
  addedBy!: Relation<User>;
}
