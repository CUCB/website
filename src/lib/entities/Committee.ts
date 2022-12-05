import { Collection, Entity, OneToMany, PrimaryKey, Property } from "@mikro-orm/core";
import type { DateTime } from "luxon";
import { CommitteeMember } from "./CommitteeMember";

@Entity({ schema: "cucb", tableName: "committees" })
export class Committee {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 6, type: "timestamptz" })
  started!: Date;

  @Property({ length: 255, nullable: true, type: "varchar" })
  picFolder?: string;

  @OneToMany({ entity: () => CommitteeMember, mappedBy: "committee", index: "idx_17360_committee" })
  members = new Collection<CommitteeMember>(this);
}
