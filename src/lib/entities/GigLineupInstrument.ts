import { Entity, Filter, Index, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { GigLineup } from "./GigLineup";
import { UserInstrument } from "./UsersInstrument";

@Entity({ schema: "cucb", tableName: "gigs_lineups_instruments" })
@Index({ name: "idx_17435_gig_id", properties: ["gig_id", "user_id"] })
@Index({ name: "idx_17435_user_instrument_id", properties: ["user_instrument", "user_id"] })
@Filter({ name: "approved", cond: { approved: { $eq: true } } })
export class GigLineupInstrument {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  gig_id!: string;

  @PrimaryKey({ columnType: "int8", type: "int8" })
  user_id!: string;

  @ManyToOne({ entity: () => UserInstrument, primary: true })
  user_instrument!: UserInstrument;

  @Property({ nullable: true, type: "bool" })
  approved?: boolean;

  @ManyToOne({ entity: () => GigLineup, primary: true, fieldNames: ["gig_id", "user_id"] })
  gig_lineup!: GigLineup;
}
