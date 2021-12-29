
alter table "cucb"."gigs_lineups_instruments"
    add constraint "gigs_lineups_instruments_pkey" 
    primary key ( "gig_id", "user_id", "user_instrument_id" );