import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { MusicTypes } from "./MusicTypes.js";

@Entity({ schema: "cucb" })
export class Music {
  [OptionalProps]?: "current" | "showTune";

  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @Property({ length: 128 })
  title!: string;

  @Property({ length: 128 })
  filename!: string;

  @ManyToOne({ entity: () => MusicTypes, fieldName: "type", index: "idx_17463_type" })
  type!: MusicTypes;

  @Property({ default: true })
  current: boolean = true;

  @Property({ default: false })
  showTune: boolean = false;
}
