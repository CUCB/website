import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb" })
export class ConnectionTypes {
  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @Property({ length: 30, nullable: true })
  name?: string;

  @Property({ length: 32 })
  iconName!: string;
}
