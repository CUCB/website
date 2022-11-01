
alter table "cucb"."gigs_lineups" drop constraint "gigs_lineups_pkey";
alter table "cucb"."gigs_lineups"
    add constraint "cucb_gigs_lineups_id_key" 
    primary key ( "id" );