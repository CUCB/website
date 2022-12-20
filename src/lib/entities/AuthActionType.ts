import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { AuthBitmasksPermission } from "./AuthBitmasksPermission.js";

@Entity({ schema: "cucb", tableName: "auth_action_types" })
export class AuthActionType {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 255, type: "varchar" })
  description!: string;

  @ManyToOne({ entity: () => AuthBitmasksPermission, fieldName: "auth_bitmask", index: "idx_17283_auth_bitmask" })
  authBitmask!: AuthBitmasksPermission;
}
