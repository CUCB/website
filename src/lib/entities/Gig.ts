import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { GigType } from "./GigType";
import { GigVenue } from "./GigVenue";
import { User } from "./User";

@Entity({ schema: "cucb", tableName: "gigs" })
export class Gig {
  [OptionalProps]?: "adminsOnly" | "advertise" | "allowSignups" | "foodProvided";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 128, type: "varchar" })
  title!: string;

  @ManyToOne({ entity: () => GigType, fieldName: "type", onUpdateIntegrity: "cascade", index: "idx_17399_type" })
  type!: GigType;

  @Property({ columnType: "date", nullable: true, type: "date" })
  date?: string;

  @Property({ columnType: "time", length: 6, nullable: true, type: "time" })
  time?: string;

  @Property({ length: 6, nullable: true, type: "timestamptz" })
  arriveTime?: Date;

  @Property({ length: 6, nullable: true, type: "timestamptz" })
  finishTime?: Date;

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
  postingUser?: User;

  @Property({ length: 6, nullable: true, defaultRaw: `now()`, type: "timestamptz" })
  postingTime?: Date;

  @ManyToOne({ entity: () => User, fieldName: "editing_user", nullable: true })
  editingUser?: User;

  @Property({ length: 6, nullable: true, type: "timestamptz" })
  editingTime?: Date;

  @Property({ columnType: "text", nullable: true, type: "text" })
  summary?: string;

  @Property({ columnType: "date", nullable: true, type: "date" })
  quoteDate?: string;

  @Property({ columnType: "text", nullable: true, type: "text" })
  finance?: string;

  @Property({ nullable: true, default: false, type: "bool" })
  financeDepositReceived?: boolean = false;

  @Property({ nullable: true, default: false, type: "bool" })
  financePaymentReceived?: boolean = false;

  @Property({ nullable: true, default: false, type: "bool" })
  financeCallerPaid?: boolean = false;

  @Property({ columnType: "text", nullable: true, type: "text" })
  notesBand?: string;

  @Property({ columnType: "text", nullable: true, type: "text" })
  notesAdmin?: string;

  @Property({ default: false, type: "bool" })
  advertise: boolean = false;

  @Property({ default: true, type: "bool" })
  adminsOnly: boolean = true;

  @Property({ default: false, type: "bool" })
  allowSignups: boolean = false;

  @Property({ default: false, type: "bool" })
  foodProvided: boolean = false;
}
