import { Entity, OptionalProps, PrimaryKey, Property, Unique } from "@mikro-orm/core";

@Entity({ schema: "cucb" })
export class MusicTypes {
  [OptionalProps]?: "commonType";

  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @Unique({ name: "idx_17471_abc_field" })
  @Property({ length: 32 })
  abcField!: string;

  @Property({ length: 32 })
  name!: string;

  @Property({ columnType: "text" })
  description!: string;

  @Property({ default: false })
  commonType: boolean = false;
}
