import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "./User";

@Entity({ schema: "cucb" })
export class AuthTokens {
  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @Property({ length: 255 })
  hash!: string;

  @ManyToOne({ entity: () => User, onUpdateIntegrity: "cascade", onDelete: "cascade", index: "idx_17295_user_id" })
  user!: User;

  @Property({ length: 6 })
  expires!: Date;

  @Property({ length: 255 })
  deviceId!: string;
}
