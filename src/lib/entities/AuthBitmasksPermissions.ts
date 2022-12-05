import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb" })
export class AuthBitmasksPermissions {
  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @Property({ length: 255 })
  phpTitle!: string;

  @Property({ columnType: "int8" })
  bitmask!: string;
}
