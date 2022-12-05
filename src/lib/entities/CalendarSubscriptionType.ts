import { Entity, PrimaryKey } from "@mikro-orm/core";

@Entity({ schema: "cucb", tableName: "calendar_subscriptions_types" })
export class CalendarSubscriptionType {
  @PrimaryKey({ columnType: "text", type: "text" })
  name!: string;
}
