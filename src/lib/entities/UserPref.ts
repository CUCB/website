import { Entity, Filter, ManyToOne, Property, Unique } from "@mikro-orm/core";
import { UserPrefType as UserPrefType } from "./UserPrefType.js";
import { User } from "./User.js";
import type { Relation } from "./bodge.js";

@Entity({ schema: "cucb", tableName: "user_prefs" })
@Unique({ name: "idx_17543_userpref", properties: ["user", "pref_type"] })
@Filter({ name: "isAttribute", cond: { pref_type: { name: { $ilike: "attribute.%" } } } })
export class UserPref {
  @ManyToOne({ entity: () => User, primary: true, onDelete: "cascade" })
  user!: Relation<User>;

  @ManyToOne({ entity: () => UserPrefType, primary: true, index: "idx_17543_pref_id", fieldName: "pref_id" })
  pref_type!: UserPrefType;

  @Property({ type: "bool" })
  value!: boolean;
}
