import { Entity, OptionalProps, PrimaryKey, Property, Unique } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "music_types" })
export class MusicType {
  [OptionalProps]?: "commonType";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Unique({ name: "idx_17471_abc_field" })
  @Property({ length: 32, type: "varchar" })
  abcField!: string;

  @Property({ length: 32, type: "varchar" })
  name!: string;

  @Property({ columnType: "text", type: "text" })
  description!: string;

  @Property({ default: false, type: "boolean" })
  commonType: boolean = false;
}
