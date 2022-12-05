import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "committee_positions" })
export class CommitteePosition {
  @PrimaryKey({ columnType: "int8", type: "bigint" })
  id!: string;

  @Property({ length: 255, type: "varchar" })
  name!: string;

  @Property({ columnType: "int8", type: "varchar" })
  position!: string;
}
