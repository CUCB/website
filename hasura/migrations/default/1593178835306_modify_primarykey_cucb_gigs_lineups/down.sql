
alter table "cucb"."gigs_lineups" drop constraint "gigs_lineups_pkey";
alter table "cucb"."gigs_lineups"
    add constraint "gigs_lineups_pkey" 
    primary key ( "user_id", "gig_id" );