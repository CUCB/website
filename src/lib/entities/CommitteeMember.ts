import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { CommitteeKey } from "./CommitteeKey.js";
import { CommitteePosition } from "./CommitteePosition.js";
import { Committee } from "./Committee";

@Entity({ schema: "cucb", tableName: "committee_members" })
export class CommitteeMember {
  [OptionalProps]?: "aprilFoolsOnly" | "hidden";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @ManyToOne({ entity: () => CommitteePosition, fieldName: "position", index: "idx_17360_position" })
  position!: CommitteePosition;

  @Property({ length: 255, type: "varchar" })
  name!: string;

  @Property({ length: 255, type: "varchar" })
  casualName!: string;

  @Property({ length: 10, nullable: true, type: "varchar" })
  crsid?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  email?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  emailObfus?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  pic?: string;

  @ManyToOne({ entity: () => Committee, fieldName: "committee", index: "idx_17360_committee" })
  committee!: Committee;

  @ManyToOne({ entity: () => CommitteeKey, fieldName: "lookup_name", index: "idx_17360_lookup_name" })
  lookupName!: CommitteeKey;

  @Property({ default: false, type: "boolean" })
  aprilFoolsOnly: boolean = false;

  @Property({ length: 255, nullable: true, type: "varchar" })
  comments?: string;

  @Property({ default: false, type: "boolean" })
  hidden: boolean = false;

  @Property({ length: 255, nullable: true, type: "varchar" })
  aprilFoolsDir?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  subPosition?: string;
}
