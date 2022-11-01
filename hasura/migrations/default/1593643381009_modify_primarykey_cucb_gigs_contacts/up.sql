alter table "cucb"."gigs_contacts" drop constraint "cucb_gigs_contacts_gig_id_contact_id_key";
alter table "cucb"."gigs_contacts"
    add constraint "gigs_contacts_pkey" 
    primary key ( "contact_id", "gig_id", "calling" );
