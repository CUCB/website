alter table "cucb"."gigs_contacts" drop constraint "gigs_contacts_pkey";
alter table "cucb"."gigs_contacts"
    add constraint "gigs_contacts_pkey" 
    primary key ( "client", "contact_id", "gig_id", "calling" );
