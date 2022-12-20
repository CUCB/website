import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import type { Relation } from "./bodge.js";
import { User } from "./User.js";

@Entity({ schema: "cucb", tableName: "biscuit_polls" })
export class BiscuitPoll {
  [OptionalProps]?: "archived" | "createdAt" | "open";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @ManyToOne({ entity: () => User, fieldName: "created_by", index: "idx_17313_created_by" })
  createdBy!: Relation<User>;

  @Property({ length: 6, defaultRaw: `now()`, type: "timestamptz" })
  createdAt!: Date;

  @Property({ default: true, type: "boolean" })
  open: boolean = true;

  @Property({ default: false, type: "boolean" })
  archived: boolean = false;

  @Property({ columnType: "date", type: "date", nullable: true })
  rehearsalDate?: string;
}
