import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import type { Relation } from "./bodge.js";
import { MusicType } from "./MusicType.js";
import { User } from "./User.js";

@Entity({ schema: "cucb", tableName: "session_tunes" })
export class SessionTune {
  [OptionalProps]?: "hidden";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  title?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  filename?: string;

  @ManyToOne({ entity: () => MusicType, fieldName: "type", onUpdateIntegrity: "cascade", index: "idx_17497_type" })
  type!: MusicType;

  @Property({ columnType: "date", type: "date" })
  touched!: string;

  @ManyToOne({
    entity: () => User,
    fieldName: "contributor",
    onUpdateIntegrity: "cascade",
    index: "idx_17497_contributor",
  })
  contributor!: Relation<User>;

  @Property({ columnType: "date", type: "date" })
  contributedDate!: string;

  @Property({ columnType: "text", nullable: true, type: "text" })
  contributorNotes?: string;

  @Property({ columnType: "text", nullable: true, type: "text" })
  otherNotes?: string;

  @Property({ default: false, type: "boolean" })
  hidden: boolean = false;
}
