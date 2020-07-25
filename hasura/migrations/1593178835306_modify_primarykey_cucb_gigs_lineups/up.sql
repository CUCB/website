
alter table "cucb"."gigs_lineups" drop constraint "gigs_lineups_pkey";
alter table "cucb"."gigs_lineups"
    add constraint "gigs_lineups_pkey" 
    primary key ( "gig_id", "user_id" );