import { Collection, Entity, ManyToOne, OneToMany, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { DateTime } from "luxon";
import type { Relation } from "./bodge.js";
import { GigContact } from "./GigContact.js";
import { GigLineupEntry } from "./GigLineupEntry.js";
import { GigType } from "./GigType.js";
import { GigVenue } from "./GigVenue.js";
import { User } from "./User.js";

@Entity({ schema: "cucb", tableName: "gigs" })
export class Gig {
  [OptionalProps]?: "admins_only" | "advertise" | "allow_signups" | "food_provided";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 128, type: "varchar" })
  title!: string;

  @ManyToOne({ entity: () => GigType, fieldName: "type", onUpdateIntegrity: "cascade", index: "idx_17399_type" })
  type!: GigType;

  @Property({ columnType: "date", type: "date", nullable: true })
  date?: Date | null;

  @Property({ columnType: "time", length: 6, nullable: true, type: "time" })
  time?: string;

  @Property({ length: 6, nullable: true, type: "timestamptz" })
  arrive_time?: Date;

  @Property({ length: 6, nullable: true, type: "timestamptz" })
  finish_time?: Date;

  @ManyToOne({ entity: () => GigVenue, onUpdateIntegrity: "cascade", nullable: true, index: "idx_17399_venue_id" })
  venue?: GigVenue;

  @ManyToOne({
    entity: () => User,
    fieldName: "posting_user",
    onUpdateIntegrity: "cascade",
    onDelete: "set null",
    nullable: true,
    index: "idx_17399_posting_user",
  })
  posting_user?: Relation<User>;

  @Property({ length: 6, nullable: true, defaultRaw: `now()`, type: "timestamptz" })
  posting_time?: Date;

  @ManyToOne({ entity: () => User, fieldName: "editing_user", nullable: true })
  editing_user?: Relation<User>;

  @Property({ length: 6, nullable: true, type: "timestamptz" })
  editing_time?: Date;

  @Property({ columnType: "text", nullable: true, type: "text" })
  summary?: string;

  @Property({ columnType: "date", nullable: true, type: "date" })
  quote_date?: Date | null;

  @Property({ columnType: "text", nullable: true, type: "text" })
  finance?: string;

  @Property({ nullable: true, default: false, type: "bool" })
  finance_deposit_received?: boolean = false;

  @Property({ nullable: true, default: false, type: "bool" })
  finance_payment_received?: boolean = false;

  @Property({ nullable: true, default: false, type: "bool" })
  finance_caller_paid?: boolean = false;

  @Property({ columnType: "text", nullable: true, type: "text" })
  notes_band?: string;

  @Property({ columnType: "text", nullable: true, type: "text" })
  notes_admin?: string;

  @Property({ default: false, type: "bool" })
  advertise: boolean = false;

  @Property({ default: true, type: "bool" })
  admins_only: boolean = true;

  @Property({ default: false, type: "bool" })
  allow_signups: boolean = false;

  @Property({ default: false, type: "bool" })
  food_provided: boolean = false;

  @OneToMany(() => GigContact, (contact) => contact.gig)
  contacts = new Collection<GigContact>(this);

  @OneToMany(() => GigLineupEntry, (entry) => entry.gig)
  lineup = new Collection<GigLineupEntry>(this);

  get sort_date(): Date {
    return (
      (this.arrive_time && DateTime.fromJSDate(this.arrive_time)) ||
      utcFromDateAndTime(this.date || new Date(), this.time || "00:00")
    ).toJSDate();
  }
}

const utcFromDateAndTime = (date: Date, time: String): DateTime =>
  DateTime.fromISO(`${DateTime.fromJSDate(date).toISODate()}T${time}Z`);
