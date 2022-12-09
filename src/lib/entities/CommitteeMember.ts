import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { CommitteeKey } from "./CommitteeKey.js";
import { CommitteePosition } from "./CommitteePosition.js";
import { Committee } from "./Committee";

@Entity({ schema: "cucb", tableName: "committee_members" })
export class CommitteeMember {
  [OptionalProps]?: "april_fools_only" | "hidden";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @ManyToOne({ entity: () => CommitteePosition, fieldName: "position", index: "idx_17360_position" })
  position!: CommitteePosition;

  @Property({ length: 255, type: "varchar" })
  name!: string;

  @Property({ length: 255, type: "varchar" })
  casual_name!: string;

  @Property({ length: 10, nullable: true, type: "varchar" })
  crsid?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  email?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  email_obfus?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  pic?: string;

  @ManyToOne({ entity: () => Committee, fieldName: "committee", index: "idx_17360_committee" })
  committee!: Committee;

  @ManyToOne({ entity: () => CommitteeKey, fieldName: "lookup_name", index: "idx_17360_lookup_name" })
  lookup_name!: CommitteeKey;

  @Property({ default: false, type: "boolean" })
  april_fools_only: boolean = false;

  @Property({ length: 255, nullable: true, type: "varchar" })
  comments?: string;

  @Property({ default: false, type: "boolean" })
  hidden: boolean = false;

  @Property({ length: 255, nullable: true, type: "varchar" })
  april_fools_dir?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  sub_position?: string;
}
