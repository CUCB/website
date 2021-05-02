ALTER TABLE "cucb"."users" ADD COLUMN "password_reset_token" varchar;
ALTER TABLE "cucb"."users" ALTER COLUMN "password_reset_token" DROP NOT NULL;
