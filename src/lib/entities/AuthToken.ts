import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import type { Relation } from "./bodge.js";
import { User } from "./User.js";

@Entity({ schema: "cucb", tableName: "auth_tokens" })
export class AuthToken {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 255, type: "varchar" })
  hash!: string;

  @ManyToOne({ entity: () => User, onUpdateIntegrity: "cascade", onDelete: "cascade", index: "idx_17295_user_id" })
  user!: Relation<User>;

  @Property({ length: 6, type: "timestamptz" })
  expires!: Date;

  @Property({ length: 255, type: "varchar" })
  deviceId!: string;
}
