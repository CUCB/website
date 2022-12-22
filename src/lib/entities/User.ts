import { Collection, Entity, ManyToOne, OneToMany, OptionalProps, PrimaryKey, Property, Unique } from "@mikro-orm/core";
import { AuthUserType } from "./AuthUserType.js";
import { GigLineupEntry } from "./GigLineupEntry.js";
import { UserPref } from "./UserPref.js";
import { UserInstrument } from "./UserInstrument.js";

@Entity({ schema: "cucb", tableName: "users" })
export class User {
  [OptionalProps]?: "admin" | "gig_notes" | "adminType";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @ManyToOne({ entity: () => AuthUserType, eager: true, fieldName: "admin", defaultRaw: "9", type: "int8" })
  adminType!: AuthUserType;

  @Property({ length: 64, nullable: false, type: "varchar" })
  first!: string;

  @Property({ length: 64, nullable: false, type: "varchar" })
  last!: string;

  @Unique({ name: "idx_17515_username" })
  @Property({ length: 255, type: "varchar" })
  username!: string;

  @Property({ length: 40, nullable: true, type: "varchar", hidden: true })
  password?: string;

  @Property({ length: 255, nullable: true, type: "varchar", hidden: true })
  saltedPassword?: string;

  @Unique({ name: "idx_17515_email" })
  @Property({ length: 255, type: "varchar" })
  email!: string;

  @Property({ length: 6, nullable: true, type: "date" })
  joinDate?: Date | null;

  @Property({ length: 6, nullable: true, type: "date" })
  lastLoginDate?: Date | null;

  @Property({ length: 255, nullable: true, type: "varchar" })
  mobileContactInfo?: string;

  @Property({ length: 512, nullable: true, type: "varchar" })
  locationInfo?: string;

  @Property({ length: 512, nullable: true, type: "varchar" })
  dietaries?: string;

  @Property({ columnType: "text", nullable: true, type: "varchar" })
  bio?: string;

  @Property({ length: 6, nullable: true, type: "date" })
  bioChangedDate?: Date;

  @Property({ default: "", type: "varchar" })
  gig_notes!: string;

  @OneToMany({ entity: () => GigLineupEntry, mappedBy: (gigLineup) => gigLineup.user })
  gigLineups = new Collection<GigLineupEntry>(this);

  @OneToMany({ entity: () => UserInstrument, mappedBy: (instrument) => instrument.user })
  instruments = new Collection<UserInstrument>(this);

  @OneToMany({ entity: () => UserPref, mappedBy: (pref) => pref.user })
  prefs = new Collection<UserPref>(this);
}
