import { Entity, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb" })
export class Photos {
  [OptionalProps]?: "filetype";

  @PrimaryKey({ columnType: "int8" })
  photoid!: string;

  @Property({ length: 120, nullable: true })
  filename?: string;

  @Property({ columnType: "photos_filetype", default: "jpeg" })
  filetype!: unknown;

  @Property({ length: 40, nullable: true })
  path?: string;

  @Property({ length: 100, nullable: true })
  thumbnail?: string;

  @Property({ columnType: "int8", nullable: true })
  takenBy?: string;
}
