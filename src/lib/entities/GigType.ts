import { Entity, PrimaryKey, Property, Unique } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "gig_types" })
export class GigType {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Unique({ name: "idx_17440_code" })
  @Property({ length: 16, type: "varchar" })
  code!: string;

  @Property({ length: 128, type: "varchar" })
  title!: string;
}
