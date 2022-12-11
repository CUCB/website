import { Entity, Index, ManyToOne, OneToMany, OptionalProps, PrimaryKey, Property, Collection } from "@mikro-orm/core";
import { GigLineupInstrument } from "./GigLineupInstrument";
import { Instrument } from "./Instrument";
import { User } from "./User";

@Entity({ schema: "cucb", tableName: "users_instruments" })
@Index({ name: "idx_17525_id", properties: ["id", "user"] })
export class UserInstrument {
  [OptionalProps]?: "deleted";

  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @ManyToOne({ entity: () => User, onUpdateIntegrity: "cascade", onDelete: "cascade", index: "idx_17525_user_id" })
  user!: User;

  @ManyToOne({
    entity: () => Instrument,
    onUpdateIntegrity: "cascade",
    index: "idx_17525_instr_id",
    fieldName: "instr_id",
  })
  instrument!: Instrument;

  @Property({ length: 128, nullable: true, type: "varchar" })
  nickname?: string;

  @Property({ default: false, type: "boolean" })
  deleted: boolean = false;

  @OneToMany({ entity: () => GigLineupInstrument, mappedBy: (lineupInstrument) => lineupInstrument.user_instrument })
  lineup_entries = new Collection<GigLineupInstrument>(this);
}
