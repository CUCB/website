import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { AuthBitmasksPermissions } from "./AuthBitmasksPermissions.js";

@Entity({ schema: "cucb" })
export class AuthActionTypes {
  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @Property({ length: 255 })
  description!: string;

  @ManyToOne({ entity: () => AuthBitmasksPermissions, fieldName: "auth_bitmask", index: "idx_17283_auth_bitmask" })
  authBitmask!: AuthBitmasksPermissions;
}
