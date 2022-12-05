import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { BiscuitPolls } from "./BiscuitPolls.js";
import { User } from "./User";

@Entity({ schema: "cucb" })
export class BiscuitPollEntries {
  [OptionalProps]?: "addedAt";

  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @Property({ length: 255 })
  name!: string;

  @ManyToOne({ entity: () => BiscuitPolls, fieldName: "poll", index: "idx_17322_poll" })
  poll!: BiscuitPolls;

  @Property({ length: 6, defaultRaw: `now()` })
  addedAt!: Date;

  @ManyToOne({ entity: () => User, fieldName: "added_by", index: "idx_17322_added_by" })
  addedBy!: User;
}
