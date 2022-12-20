import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import type { Relation } from "./bodge.js";
import { CalendarSubscriptionType } from "./CalendarSubscriptionType.js";
import { User } from "./User.js";

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

  @ManyToOne({ entity: () => CalendarSubscriptionType, fieldName: "calendar_type", primary: true })
  calendarType!: CalendarSubscriptionType;

  @Property({ length: 6, type: "timestamptz" })
  lastAccessed!: Date;

  @Property({ length: 64, type: "varchar" })
  ipAddress!: string;
}
