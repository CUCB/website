
alter table "cucb"."gigs_lineups" drop constraint "cucb_gigs_lineups_id_key";
alter table "cucb"."gigs_lineups"
    add constraint "gigs_lineups_pkey" 
    primary key ( "gig_id", "user_id" );