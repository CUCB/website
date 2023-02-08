import { Collection, Entity, OneToMany, PrimaryKey, Property } from "@mikro-orm/core";
import { Gig } from "./Gig";

@Entity({ schema: "cucb", tableName: "gig_venues" })
export class GigVenue {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 256, type: "varchar" })
  name!: string;

  @Property({ length: 256, nullable: true, type: "varchar" })
  subvenue?: string | null;

  @Property({ length: 1024, nullable: true, type: "varchar" })
  map_link?: string | null;

  @Property({ columnType: "int8", nullable: true, type: "int8" })
  distance_miles?: string | null;

  @Property({ columnType: "text", nullable: true, type: "text" })
  notes_admin?: string | null;

  @Property({ columnType: "text", nullable: true, type: "text" })
  notes_band?: string | null;

  @Property({ length: 255, nullable: true, type: "varchar" })
  address?: string | null;

  @Property({ length: 32, nullable: true, type: "varchar" })
  postcode?: string | null;

  @Property({ columnType: "float8", nullable: true, type: "double" })
  latitude?: number | null;

  @Property({ columnType: "float8", nullable: true, type: "double" })
  longitude?: number | null;

  @OneToMany({ entity: () => Gig, mappedBy: "venue" })
  gigs = new Collection<Gig>(this);
}
