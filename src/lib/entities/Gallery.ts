import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "gallery" })
export class Gallery {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: number;

  @Property({ columnType: "text", type: "text" })
  description!: string;

  @Property({ columnType: "boolean", type: "boolean" })
  secure!: boolean;

  @Property({ length: 512, nullable: true, type: "varchar" })
  attribution?: string;
}
