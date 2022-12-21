import { Entity, Filter, PrimaryKey, Property, Unique } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "user_pref_types" })
@Filter({ name: "isAttribute", cond: { name: { $ilike: "attribute.%" } } })
export class UserPrefType {
  @Property({ columnType: "int8", type: "int8", primary: true, unique: true })
  id!: string;

  @Unique({ name: "idx_17551_name" })
  @Property({ length: 250, type: "varchar" })
  name!: string;

  @Property({ type: "bool" })
  default!: boolean;
}
