import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { MusicTypes } from "./MusicTypes.js";
import { User } from "./User";

@Entity({ schema: "cucb" })
export class SessionTunes {
  [OptionalProps]?: "hidden";

  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @Property({ length: 255, nullable: true })
  title?: string;

  @Property({ length: 255, nullable: true })
  filename?: string;

  @ManyToOne({ entity: () => MusicTypes, fieldName: "type", onUpdateIntegrity: "cascade", index: "idx_17497_type" })
  type!: MusicTypes;

  @Property({ columnType: "date" })
  touched!: string;

  @ManyToOne({
    entity: () => Users,
    fieldName: "contributor",
    onUpdateIntegrity: "cascade",
    index: "idx_17497_contributor",
  })
  contributor!: Users;

  @Property({ columnType: "date" })
  contributedDate!: string;

  @Property({ columnType: "text", nullable: true })
  contributorNotes?: string;

  @Property({ columnType: "text", nullable: true })
  otherNotes?: string;

  @Property({ default: false })
  hidden: boolean = false;
}
