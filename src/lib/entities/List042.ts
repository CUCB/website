import { Entity, PrimaryKey } from "@mikro-orm/core";

@Entity({ schema: "cucb" })
export class List042 {
  @PrimaryKey({ columnType: "text", type: "string" })
  email!: string;
}
