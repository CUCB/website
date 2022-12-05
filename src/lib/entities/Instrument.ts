import { Collection, Entity, ManyToOne, OneToMany, OptionalProps, PrimaryKey, Property, Unique } from "@mikro-orm/core";
import { UserInstrument } from "./UsersInstrument";

@Entity({ schema: "cucb", tableName: "instruments" })
export class Instrument {
  [OptionalProps]?: "novelty" | "parentOnly";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Unique({ name: "idx_17455_name" })
  @Property({ length: 128, type: "varchar" })
  name!: string;

  @Property({ default: false, type: "boolean" })
  novelty: boolean = false;

  @Property({ default: false, type: "boolean" })
  parentOnly: boolean = false;

  @ManyToOne({
    entity: () => Instrument,
    onUpdateIntegrity: "set null",
    onDelete: "set null",
    nullable: true,
    index: "idx_17455_parent_id",
    eager: true,
  })
  parent?: Instrument;

  @OneToMany({ entity: () => UserInstrument, mappedBy: (ui) => ui.instrument })
  userInstruments = new Collection<UserInstrument>(this);
}
