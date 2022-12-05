import { Entity, ManyToOne, OptionalProps, Property } from "@mikro-orm/core";
import { Contacts } from "./Contacts.js";
import { Gig } from "./Gig.js";

@Entity({ schema: "cucb" })
export class GigsContacts {
  [OptionalProps]?: "calling" | "client" | "contact";

  @ManyToOne({ entity: () => Gig, onUpdateIntegrity: "cascade", onDelete: "cascade", primary: true })
  gig!: Gig;

  @ManyToOne({
    entity: () => Contacts,
    onUpdateIntegrity: "cascade",
    primary: true,
    default: "0",
    index: "idx_17412_contact_id",
  })
  contact!: Contacts;

  @Property({ columnType: "text", nullable: true })
  notes?: string;

  @Property({ default: false })
  calling: boolean = false;

  @Property({ default: true })
  client: boolean = true;
}
