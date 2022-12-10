import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "./User";

@Entity({ schema: "cucb", tableName: "contacts" })
export class Contact {
  [OptionalProps]?: "caller";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @ManyToOne({
    entity: () => User,
    onUpdateIntegrity: "cascade",
    onDelete: "cascade",
    nullable: true,
    index: "idx_17383_user_id",
  })
  user?: User;

  @Property({ length: 128, type: "varchar" })
  name!: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  email?: string;

  @Property({ length: 255, nullable: true, type: "varchar" })
  organization?: string;

  @Property({ default: false, type: "bool" })
  caller: boolean = false;

  @Property({ columnType: "text", nullable: true, type: "varchar" })
  notes?: string;
}
