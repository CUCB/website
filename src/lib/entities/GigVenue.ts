import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb" })
export class GigVenue {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 256, type: "varchar" })
  name!: string;

  @Property({ length: 256, nullable: true, type: "varchar" })
  subvenue?: string;

  @Property({ length: 1024, nullable: true, type: "varchar" })
  mapLink?: string;

  @Property({ columnType: "int8", nullable: true, type: "int8" })
  distanceMiles?: string;

  @Property({ columnType: "text", nullable: true, type: "text" })
  notesAdmin?: string;

  @Property({ columnType: "text", nullable: true, type: "text" })
  notesBand?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  address?: string;

  @Property({ length: 32, nullable: true, type: "varchar" })
  postcode?: string;

  @Property({ columnType: "float8", nullable: true, type: "double" })
  latitude?: string;

  @Property({ columnType: "float8", nullable: true, type: "double" })
  longitude?: string;
}
