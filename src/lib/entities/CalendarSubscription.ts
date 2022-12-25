import { Entity, Enum, ManyToOne, Property } from "@mikro-orm/core";
import type { Relation } from "./bodge.js";
import { User } from "./User.js";

export enum CalendarSubscriptionType {
  allgigs = "allgigs",
  mygigs = "mygigs",
}

@Entity({ schema: "cucb", tableName: "calendar_subscriptions" })
export class CalendarSubscription {
  @ManyToOne({
    entity: () => User,
    onUpdateIntegrity: "cascade",
    onDelete: "cascade",
    primary: true,
    index: "idx_17334_user_id",
  })
  user!: Relation<User>;

  @Enum({ items: () => CalendarSubscriptionType, fieldName: "calendar_type", primary: true, type: "varchar" })
  calendarType!: CalendarSubscriptionType;

  @Property({ length: 6, type: "timestamptz" })
  lastAccessed!: Date;

  @Property({ length: 64, type: "varchar" })
  ipAddress!: string;
}
