import { Entity, OptionalProps, Property, Unique } from "@mikro-orm/core";

@Entity({ schema: "cucb" })
export class Songs {
  [OptionalProps]?: "new" | "tuneid";

  @Unique({ name: "idx_17507_id" })
  @Property({ columnType: "int8" })
  id!: string;

  @Property({ length: 64 })
  name!: string;

  @Property({ length: 64 })
  filename!: string;

  @Property({ columnType: "int8", default: "0" })
  tuneid!: string;

  @Property({ columnType: "int2", default: NaN })
  new: number = NaN;
}
