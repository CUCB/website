import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "gig_venues" })
export class GigVenue {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 256, type: "varchar" })
  name!: string;

  @Property({ length: 256, nullable: true, type: "varchar" })
  subvenue?: string;

  @Property({ length: 1024, nullable: true, type: "varchar" })
  map_link?: string;

  @Property({ columnType: "int8", nullable: true, type: "int8" })
  distance_miles?: string;

  @Property({ columnType: "text", nullable: true, type: "text" })
  notes_admin?: string;

  @Property({ columnType: "text", nullable: true, type: "text" })
  notes_band?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  address?: string;

  @Property({ length: 32, nullable: true, type: "varchar" })
  postcode?: string;

  @Property({ columnType: "float8", nullable: true, type: "double" })
  latitude?: number;

  @Property({ columnType: "float8", nullable: true, type: "double" })
  longitude?: number;
}
