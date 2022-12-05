import {
  Collection,
  Entity,
  Filter,
  ManyToOne,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/core";
import { AuthUserType } from "./AuthUserType";
import { GigLineup } from "./GigLineup";
import { UserPref } from "./UserPref";
import { UserInstrument } from "./UsersInstrument";

@Entity({ schema: "cucb", tableName: "users" })
export class User {
  [OptionalProps]?: "admin" | "gigNotes" | "adminType";

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

  @Property({ length: 40, nullable: true, type: "varchar" })
  password?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  saltedPassword?: string;

  @Unique({ name: "idx_17515_email" })
  @Property({ length: 255, type: "varchar" })
  email!: string;

  @Property({ length: 6, nullable: true, type: "date" })
  joinDate?: Date;

  @Property({ length: 6, nullable: true, type: "date" })
  lastLoginDate?: Date;

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
  gigNotes!: string;

  @OneToMany({ entity: () => GigLineup, mappedBy: (gigLineup) => gigLineup.user })
  gigLineups = new Collection<GigLineup>(this);

  @OneToMany({ entity: () => UserInstrument, mappedBy: (instrument) => instrument.user })
  instruments = new Collection<UserInstrument>(this);

  @OneToMany({ entity: () => UserPref, mappedBy: (pref) => pref.user })
  prefs = new Collection<UserPref>(this);
}
