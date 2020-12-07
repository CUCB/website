alter table "cucb"."gigs"
           add constraint "gigs_editing_user_fkey"
           foreign key ("editing_user")
           references "cucb"."users"
           ("id") on update restrict on delete restrict;
