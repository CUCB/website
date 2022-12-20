import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "auth_bitmask_permissions" })
export class AuthBitmasksPermission {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 255, type: "varchar" })
  phpTitle!: string;

  @Property({ columnType: "int8", type: "varchar" })
  bitmask!: string;
}
