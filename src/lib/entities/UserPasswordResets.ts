import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import type { Relation } from "./bodge.js";
import { User } from "./User.js";

@Entity({ schema: "cucb" })
export class UserPasswordResets {
  [OptionalProps]?: "datetime";

  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @ManyToOne({ entity: () => User, index: "idx_17538_user_id" })
  user!: Relation<User>;

  @Property({ length: 6, defaultRaw: `now()` })
  datetime!: Date;
}
