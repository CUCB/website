alter table "cucb"."calendar_subscriptions"
  add constraint "calendar_subscriptions_calendar_type_fkey"
  foreign key ("calendar_type")
  references "cucb"."calendar_subscriptions_types"
  ("name") on update restrict on delete restrict;