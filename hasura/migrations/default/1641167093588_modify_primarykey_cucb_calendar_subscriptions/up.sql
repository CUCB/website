alter table "cucb"."calendar_subscriptions"
    add constraint "calendar_subscriptions_pkey"
    primary key ("user_id", "calendar_type");
