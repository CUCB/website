import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "connection_types" })
export class ConnectionType {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 30, nullable: true, type: "varchar" })
  name?: string;

  @Property({ length: 32, type: "varchar" })
  iconName!: string;
}
