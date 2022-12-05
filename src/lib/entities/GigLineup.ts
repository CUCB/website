import { Collection, Entity, Filter, ManyToOne, OneToMany, OptionalProps, Property, Unique } from "@mikro-orm/core";
import { Gig } from "./Gig";
import { GigLineupInstrument } from "./GigLineupInstrument";
import { User } from "./User";

@Entity({ schema: "cucb", tableName: "gigs_lineups" })
@Unique({ name: "idx_17423_gig_id", properties: ["gig", "user"] })
@Filter({ name: "approved", cond: { approved: { $eq: true } } })
export class GigLineup {
  [OptionalProps]?: "driver" | "equipment" | "leader" | "moneyCollector" | "moneyCollectorNotified";

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
  addingTime?: Date;

  @Property({ length: 6, nullable: true, type: "timestamptz" })
  editingTime?: Date;

  @Property({ nullable: true, type: "bool" })
  approved?: boolean;

  @Property({ default: false, type: "bool" })
  equipment: boolean = false;

  @Property({ default: false, type: "bool" })
  leader: boolean = false;

  @Property({ default: false, type: "bool" })
  driver: boolean = false;

  @Property({ default: false, type: "bool" })
  moneyCollector: boolean = false;

  @Property({ default: false, type: "bool" })
  moneyCollectorNotified: boolean = false;

  @Property({ columnType: "text", nullable: true, type: "text" })
  userNotes?: string;

  @Property({ nullable: true, type: "bool" })
  userAvailable?: boolean;

  @Property({ nullable: true, type: "bool" })
  userOnlyIfNecessary?: boolean;

  @Property({ columnType: "text", nullable: true, type: "text" })
  adminNotes?: string;

  @OneToMany({ entity: () => GigLineupInstrument, mappedBy: "gigLineup" })
  userInstruments = new Collection<GigLineupInstrument>(this);
}
