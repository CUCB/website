alter table "cucb"."calendar_subscriptions" drop constraint "calendar_subscriptions_calendar_type_fkey";
DELETE FROM "cucb"."calendar_subscriptions_types" WHERE "name" = 'allgigs';
DELETE FROM "cucb"."calendar_subscriptions_types" WHERE "name" = 'mygigs';
