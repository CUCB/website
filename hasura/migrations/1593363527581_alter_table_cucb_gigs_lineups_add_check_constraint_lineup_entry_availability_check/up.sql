
alter table "cucb"."gigs_lineups" add constraint "lineup_entry_availability_check" check (NOT (user_available = FALSE AND user_only_if_necessary = TRUE));