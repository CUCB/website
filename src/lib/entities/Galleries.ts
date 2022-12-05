import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb" })
export class Galleries {
  @PrimaryKey()
  id!: number;

  @Property({ columnType: "text" })
  description!: string;

  @Property()
  secure!: boolean;

  @Property({ length: 512, nullable: true })
  attribution?: string;
}
