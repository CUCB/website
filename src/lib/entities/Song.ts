import { Entity, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "songs" })
export class Song {
  [OptionalProps]?: "new" | "tuneid";

  @Property({ columnType: "int8", type: "int8", primary: true })
  id!: string;

  @Property({ length: 64, type: "varchar" })
  name!: string;

  @Property({ length: 64, type: "varchar" })
  filename!: string;

  @Property({ columnType: "int8", default: "0", type: "int8" })
  tuneid!: string;

  @Property({ columnType: "boolean", default: true, type: "boolean" })
  new: boolean = true;
}
