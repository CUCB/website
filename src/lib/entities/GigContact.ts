import { Entity, ManyToOne, OptionalProps, Property } from "@mikro-orm/core";
import type { Relation } from "./bodge.js";
import { Contact } from "./Contact.js";
import { Gig } from "./Gig.js";

@Entity({ schema: "cucb", tableName: "gigs_contacts" })
export class GigContact {
  [OptionalProps]?: "calling" | "client" | "contact";

  @ManyToOne({ entity: () => Gig, onUpdateIntegrity: "cascade", onDelete: "cascade", primary: true })
  gig!: Relation<Gig>;

  @ManyToOne({
    entity: () => Contact,
    onUpdateIntegrity: "cascade",
    primary: true,
    default: "0",
    index: "idx_17412_contact_id",
  })
  contact!: Contact;

  @Property({ columnType: "text", nullable: true, type: "text" })
  notes?: string;

  @Property({ default: false, type: "bool" })
  calling: boolean = false;

  @Property({ default: true, type: "bool" })
  client: boolean = true;
}
