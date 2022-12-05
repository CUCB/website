import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "./User";

@Entity({ schema: "cucb" })
export class UserPasswordResets {
  [OptionalProps]?: "datetime";

  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @ManyToOne({ entity: () => Users, index: "idx_17538_user_id" })
  user!: Users;

  @Property({ length: 6, defaultRaw: `now()` })
  datetime!: Date;
}
