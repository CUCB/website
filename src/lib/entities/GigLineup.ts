import { Collection, Entity, Filter, ManyToOne, OneToMany, OptionalProps, Property, Unique } from "@mikro-orm/core";
import { Gig } from "./Gig";
import { GigLineupInstrument } from "./GigLineupInstrument";
import { User } from "./User";

@Entity({ schema: "cucb", tableName: "gigs_lineups" })
@Unique({ name: "idx_17423_gig_id", properties: ["gig", "user"] })
@Filter({ name: "approved", cond: { approved: { $eq: true } } })
export class GigLineup {
  [OptionalProps]?: "driver" | "equipment" | "leader" | "money_collector" | "money_collector_notified";

  @Property({ columnType: "int8", type: "int8" })
  id!: string;

  @ManyToOne({ entity: () => Gig, onUpdateIntegrity: "cascade", onDelete: "cascade", primary: true })
  gig!: Gig;

  @ManyToOne({
    entity: () => User,
    onUpdateIntegrity: "cascade",
    onDelete: "cascade",
    primary: true,
    index: "idx_17423_user_id",
  })
  user!: User;

  @Property({ length: 6, nullable: true, defaultRaw: `now()`, type: "timestamptz" })
  adding_time?: Date;

  // TODO this should have some sql thing to track when updated?
  @Property({ length: 6, nullable: true, type: "timestamptz" })
  editing_time?: Date;

  @Property({ nullable: true, type: "bool" })
  approved?: boolean | null;

  @Property({ default: false, type: "bool" })
  equipment: boolean = false;

  @Property({ default: false, type: "bool" })
  leader: boolean = false;

  @Property({ default: false, type: "bool" })
  driver: boolean = false;

  @Property({ default: false, type: "bool" })
  money_collector: boolean = false;

  @Property({ default: false, type: "bool" })
  money_collector_notified: boolean = false;

  @Property({ columnType: "text", nullable: true, type: "text" })
  user_notes?: string;

  @Property({ nullable: true, type: "bool" })
  user_available?: boolean;

  @Property({ nullable: true, type: "bool" })
  user_only_if_necessary?: boolean;

  @Property({ columnType: "text", nullable: true, type: "text" })
  admin_notes?: string | null;

  @OneToMany({ entity: () => GigLineupInstrument, mappedBy: "gig_lineup" })
  user_instruments = new Collection<GigLineupInstrument>(this);
}
