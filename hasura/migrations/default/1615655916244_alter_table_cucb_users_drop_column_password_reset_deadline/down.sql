ALTER TABLE "cucb"."users" ADD COLUMN "password_reset_deadline" timestamptz;
ALTER TABLE "cucb"."users" ALTER COLUMN "password_reset_deadline" DROP NOT NULL;
