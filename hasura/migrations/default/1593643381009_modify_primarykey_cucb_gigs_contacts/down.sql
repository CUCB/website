alter table "cucb"."gigs_contacts" drop constraint "gigs_contacts_pkey";
alter table "cucb"."gigs_contacts"
    add constraint "cucb_gigs_contacts_gig_id_contact_id_key" 
    primary key ( "contact_id", "gig_id" );
