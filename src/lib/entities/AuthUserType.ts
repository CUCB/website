import { Entity, PrimaryKey, Property, Unique } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "auth_user_types" })
export class AuthUserType {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 255, type: "varchar" })
  title!: string;

  @Property({ length: 255, type: "varchar" })
  phpTitle!: string;

  @Unique({ name: "auth_user_types_hasura_role_key" })
  @Property({ type: "varchar" })
  hasuraRole!: string;
}
