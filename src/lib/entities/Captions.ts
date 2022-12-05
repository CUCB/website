import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb" })
export class Captions {
  @PrimaryKey({ columnType: "int8" })
  captionid!: string;

  @Property({ columnType: "int8", nullable: true })
  userid?: string;

  @Property({ length: 20, nullable: true })
  photo?: string;

  @Property({ nullable: true })
  text?: Buffer;

  @Property({ length: 6, nullable: true })
  time?: Date;

  @Property({ columnType: "int8", nullable: true })
  dirid?: string;

  @Property({ columnType: "int8", nullable: true })
  photoid?: string;
}
