import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "./User";

@Entity({ schema: "cucb" })
export class Contacts {
  [OptionalProps]?: "caller";

  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @ManyToOne({
    entity: () => Users,
    onUpdateIntegrity: "cascade",
    onDelete: "cascade",
    nullable: true,
    index: "idx_17383_user_id",
  })
  user?: Users;

  @Property({ length: 128 })
  name!: string;

  @Property({ length: 255, nullable: true })
  email?: string;

  @Property({ length: 255, nullable: true })
  organization?: string;

  @Property({ default: false })
  caller: boolean = false;

  @Property({ columnType: "text", nullable: true })
  notes?: string;
}
