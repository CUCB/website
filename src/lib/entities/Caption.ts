import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "captions" })
export class Caption {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  captionid!: string;

  @Property({ columnType: "int8", nullable: true, type: "int8" })
  userid?: string;

  @Property({ length: 20, nullable: true, type: "varchar" })
  photo?: string;

  @Property({ nullable: true, type: "blob" })
  text?: Buffer;

  @Property({ length: 6, nullable: true, type: "timestamptz" })
  time?: Date;

  @Property({ columnType: "int8", nullable: true, type: "int8" })
  dirid?: string;

  @Property({ columnType: "int8", nullable: true, type: "int8" })
  photoid?: string;
}
