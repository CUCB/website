import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { MusicType } from "./MusicType.js";

@Entity({ schema: "cucb" })
export class Music {
  [OptionalProps]?: "current" | "showTune";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 128, type: "varchar" })
  title!: string;

  @Property({ length: 128, type: "varchar" })
  filename!: string;

  @ManyToOne({ entity: () => MusicType, fieldName: "type", index: "idx_17463_type" })
  type!: MusicType;

  @Property({ default: true, type: "boolean" })
  current: boolean = true;

  @Property({ default: false, type: "boolean" })
  showTune: boolean = false;
}
