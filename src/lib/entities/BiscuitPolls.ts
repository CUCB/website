import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "./User";

@Entity({ schema: "cucb" })
export class BiscuitPolls {
  [OptionalProps]?: "archived" | "createdAt" | "open";

  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @ManyToOne({ entity: () => Users, fieldName: "created_by", index: "idx_17313_created_by" })
  createdBy!: Users;

  @Property({ length: 6, defaultRaw: `now()` })
  createdAt!: Date;

  @Property({ default: true })
  open: boolean = true;

  @Property({ default: false })
  archived: boolean = false;

  @Property({ columnType: "date", nullable: true })
  rehearsalDate?: string;
}
