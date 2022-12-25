"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Migration } = require("@mikro-orm/migrations");

class Migration20221225070638 extends Migration {
  async up() {
    this.addSql('create schema if not exists "cucb";');

    this.addSql(
      'create table "cucb"."auth_bitmasks_permissions" ("id" bigserial primary key, "php_title" varchar(255) not null, "bitmask" int8 not null);',
    );

    this.addSql(
      'create table "cucb"."auth_action_types" ("id" bigserial primary key, "description" varchar(255) not null, "auth_bitmask" bigint not null);',
    );
    this.addSql('create index "idx_17283_auth_bitmask" on "cucb"."auth_action_types" ("auth_bitmask");');

    this.addSql(
      'create table "cucb"."auth_user_types" ("id" bigserial primary key, "title" varchar(255) not null, "php_title" varchar(255) not null, "hasura_role" varchar(255) not null);',
    );
    this.addSql(
      'alter table "cucb"."auth_user_types" add constraint "auth_user_types_hasura_role_key" unique ("hasura_role");',
    );

    this.addSql(
      'create table "cucb"."captions" ("captionid" bigserial primary key, "userid" int8 null, "photo" varchar(20) null, "text" bytea null, "time" timestamptz(6) null, "dirid" int8 null, "photoid" int8 null);',
    );

    this.addSql(
      'create table "cucb"."committees" ("id" bigserial primary key, "started" timestamptz(6) not null, "pic_folder" varchar(255) null);',
    );

    this.addSql('create table "cucb"."committee_keys" ("id" bigserial primary key, "name" varchar(255) not null);');

    this.addSql(
      'create table "cucb"."committee_positions" ("id" bigserial primary key, "name" varchar(255) not null, "position" int8 not null);',
    );

    this.addSql(
      'create table "cucb"."committee_members" ("id" bigserial primary key, "position" bigint not null, "name" varchar(255) not null, "casual_name" varchar(255) not null, "crsid" varchar(10) null, "email" varchar(255) null, "email_obfus" varchar(255) null, "pic" varchar(255) null, "committee" bigint not null, "lookup_name" bigint not null, "april_fools_only" boolean not null default false, "comments" varchar(255) null, "hidden" boolean not null default false, "april_fools_dir" varchar(255) null, "sub_position" varchar(255) null);',
    );
    this.addSql('create index "idx_17360_position" on "cucb"."committee_members" ("position");');
    this.addSql('create index "idx_17360_committee" on "cucb"."committee_members" ("committee");');
    this.addSql('create index "idx_17360_lookup_name" on "cucb"."committee_members" ("lookup_name");');

    this.addSql(
      'create table "cucb"."connection_types" ("id" bigserial primary key, "name" varchar(30) null, "icon_name" varchar(32) not null);',
    );

    this.addSql(
      'create table "cucb"."gallery" ("id" bigserial primary key, "description" text not null, "secure" boolean not null, "attribution" varchar(512) null);',
    );

    this.addSql(
      'create table "cucb"."gig_types" ("id" bigserial primary key, "code" varchar(16) not null, "title" varchar(128) not null);',
    );
    this.addSql('alter table "cucb"."gig_types" add constraint "idx_17440_code" unique ("code");');

    this.addSql(
      'create table "cucb"."gig_venues" ("id" bigserial primary key, "name" varchar(256) not null, "subvenue" varchar(256) null, "map_link" varchar(1024) null, "distance_miles" int8 null, "notes_admin" text null, "notes_band" text null, "address" varchar(255) null, "postcode" varchar(32) null, "latitude" float8 null, "longitude" float8 null);',
    );

    this.addSql(
      'create table "cucb"."instruments" ("id" bigserial primary key, "name" varchar(128) not null, "novelty" boolean not null default false, "parent_only" boolean not null default false, "parent_id" bigint null);',
    );
    this.addSql('alter table "cucb"."instruments" add constraint "idx_17455_name" unique ("name");');
    this.addSql('create index "idx_17455_parent_id" on "cucb"."instruments" ("parent_id");');

    this.addSql(
      'create table "cucb"."list042" ("email" text not null, constraint "list042_pkey" primary key ("email"));',
    );

    this.addSql(
      'create table "cucb"."music_types" ("id" bigserial primary key, "abc_field" varchar(32) not null, "name" varchar(32) not null, "description" text not null, "common_type" boolean not null default false);',
    );
    this.addSql('alter table "cucb"."music_types" add constraint "idx_17471_abc_field" unique ("abc_field");');

    this.addSql(
      'create table "cucb"."music" ("id" bigserial primary key, "title" varchar(128) not null, "filename" varchar(128) not null, "type" bigint not null, "current" boolean not null default true, "show_tune" boolean not null default false);',
    );
    this.addSql('create index "idx_17463_type" on "cucb"."music" ("type");');

    this.addSql(
      'create table "cucb"."session" ("sid" varchar(255) not null, "sess" json not null, "expire" timestamptz(6) not null, constraint "session_pkey" primary key ("sid"));',
    );
    this.addSql('create index "IDX_session_expire" on "cucb"."session" ("expire");');

    this.addSql(
      'create table "cucb"."songs" ("id" bigserial primary key, "name" varchar(64) not null, "filename" varchar(64) not null, "tuneid" int8 not null default \'0\', "new" boolean not null default true);',
    );

    this.addSql(
      'create table "cucb"."users" ("id" bigserial primary key, "admin" bigint not null default 9, "first" varchar(64) not null, "last" varchar(64) not null, "username" varchar(255) not null, "password" varchar(40) null, "salted_password" varchar(255) null, "email" varchar(255) not null, "join_date" timestamptz(6) null, "last_login_date" timestamptz(6) null, "mobile_contact_info" varchar(255) null, "location_info" varchar(512) null, "dietaries" varchar(512) null, "bio" text null, "bio_changed_date" timestamptz(6) null, "gig_notes" varchar(255) not null default \'\');',
    );
    this.addSql('alter table "cucb"."users" add constraint "idx_17515_username" unique ("username");');
    this.addSql('alter table "cucb"."users" add constraint "idx_17515_email" unique ("email");');

    this.addSql(
      'create table "cucb"."session_tunes" ("id" bigserial primary key, "title" varchar(255) null, "filename" varchar(255) null, "type" bigint not null, "touched" date not null, "contributor" bigint not null, "contributed_date" date not null, "contributor_notes" text null, "other_notes" text null, "hidden" boolean not null default false);',
    );
    this.addSql('create index "idx_17497_type" on "cucb"."session_tunes" ("type");');
    this.addSql('create index "idx_17497_contributor" on "cucb"."session_tunes" ("contributor");');

    this.addSql(
      'create table "cucb"."news" ("id" bigserial primary key, "title" varchar(255) not null, "description" text not null, "posted" timestamptz(6) null, "posted_by" bigint not null);',
    );
    this.addSql('create index "idx_17481_posted_by" on "cucb"."news" ("posted_by");');

    this.addSql(
      'create table "cucb"."gigs" ("id" bigserial primary key, "title" varchar(128) not null, "type" bigint not null, "date" date null, "time" time null, "arrive_time" timestamptz(6) null, "finish_time" timestamptz(6) null, "venue_id" bigint null, "posting_user" bigint null, "posting_time" timestamptz(6) null default now(), "editing_user" bigint null, "editing_time" timestamptz(6) null, "summary" text null, "quote_date" date null, "finance" text null, "finance_deposit_received" boolean null default false, "finance_payment_received" boolean null default false, "finance_caller_paid" boolean null default false, "notes_band" text null, "notes_admin" text null, "advertise" boolean not null default false, "admins_only" boolean not null default true, "allow_signups" boolean not null default false, "food_provided" boolean not null default false);',
    );
    this.addSql('create index "idx_17399_type" on "cucb"."gigs" ("type");');
    this.addSql('create index "idx_17399_venue_id" on "cucb"."gigs" ("venue_id");');
    this.addSql('create index "idx_17399_posting_user" on "cucb"."gigs" ("posting_user");');

    this.addSql(
      'create table "cucb"."gigs_lineups" ("gig_id" bigint not null, "user_id" bigint not null, "adding_time" timestamptz(6) null default now(), "editing_time" timestamptz(6) null, "approved" boolean null, "equipment" boolean not null default false, "leader" boolean not null default false, "driver" boolean not null default false, "money_collector" boolean not null default false, "money_collector_notified" boolean not null default false, "user_notes" text null, "user_available" boolean null, "user_only_if_necessary" boolean null, "admin_notes" text null, constraint "gigs_lineups_pkey" primary key ("gig_id", "user_id"));',
    );
    this.addSql('create index "idx_17423_user_id" on "cucb"."gigs_lineups" ("user_id");');
    this.addSql('alter table "cucb"."gigs_lineups" add constraint "idx_17423_gig_id" unique ("gig_id", "user_id");');

    this.addSql(
      'create table "cucb"."contacts" ("id" bigserial primary key, "user_id" bigint null, "name" varchar(128) not null, "email" varchar(255) null, "organization" varchar(255) null, "caller" boolean not null default false, "notes" text null);',
    );
    this.addSql('create index "idx_17383_user_id" on "cucb"."contacts" ("user_id");');

    this.addSql(
      'create table "cucb"."gigs_contacts" ("gig_id" bigint not null, "contact_id" bigint not null default \'0\', "notes" text null, "calling" boolean not null default false, "client" boolean not null default true, constraint "gigs_contacts_pkey" primary key ("gig_id", "contact_id"));',
    );
    this.addSql('create index "idx_17412_contact_id" on "cucb"."gigs_contacts" ("contact_id");');

    this.addSql(
      'create table "cucb"."calendar_subscriptions" ("user_id" bigint not null, "calendar_type" text check ("calendar_type" in (\'allgigs\', \'mygigs\')) not null, "last_accessed" timestamptz(6) not null, "ip_address" varchar(64) not null, constraint "calendar_subscriptions_pkey" primary key ("user_id", "calendar_type"));',
    );
    this.addSql('create index "idx_17334_user_id" on "cucb"."calendar_subscriptions" ("user_id");');

    this.addSql(
      'create table "cucb"."biscuit_polls" ("id" bigserial primary key, "created_by" bigint not null, "created_at" timestamptz(6) not null default now(), "open" boolean not null default true, "archived" boolean not null default false, "rehearsal_date" date null);',
    );
    this.addSql('create index "idx_17313_created_by" on "cucb"."biscuit_polls" ("created_by");');

    this.addSql(
      'create table "cucb"."biscuit_poll_entries" ("id" bigserial primary key, "name" varchar(255) not null, "poll" bigint not null, "added_at" timestamptz(6) not null default now(), "added_by" bigint not null);',
    );
    this.addSql('create index "idx_17322_poll" on "cucb"."biscuit_poll_entries" ("poll");');
    this.addSql('create index "idx_17322_added_by" on "cucb"."biscuit_poll_entries" ("added_by");');

    this.addSql(
      'create table "cucb"."biscuit_poll_votes" ("id" bigserial primary key, "user" bigint not null, "cast_at" timestamptz(6) not null default now(), "vote_for" bigint not null);',
    );
    this.addSql('create index "idx_17329_user" on "cucb"."biscuit_poll_votes" ("user");');
    this.addSql('create index "idx_17329_vote_for" on "cucb"."biscuit_poll_votes" ("vote_for");');

    this.addSql(
      'create table "cucb"."auth_tokens" ("id" bigserial primary key, "hash" varchar(255) not null, "user_id" bigint not null, "expires" timestamptz(6) not null, "device_id" varchar(255) not null);',
    );
    this.addSql('create index "idx_17295_user_id" on "cucb"."auth_tokens" ("user_id");');

    this.addSql(
      'create table "cucb"."users_instruments" ("id" bigserial primary key, "user_id" bigint not null, "instr_id" bigint not null, "nickname" varchar(128) null, "deleted" boolean not null default false);',
    );
    this.addSql('create index "idx_17525_user_id" on "cucb"."users_instruments" ("user_id");');
    this.addSql('create index "idx_17525_instr_id" on "cucb"."users_instruments" ("instr_id");');
    this.addSql('create index "idx_17525_id" on "cucb"."users_instruments" ("id", "user_id");');

    this.addSql(
      'create table "cucb"."gigs_lineups_instruments" ("gig_id" bigint not null, "user_id" bigint not null, "user_instrument_id" bigint not null, "approved" boolean null default null, constraint "gigs_lineups_instruments_pkey" primary key ("gig_id", "user_id", "user_instrument_id"));',
    );
    this.addSql(
      'create index "idx_17435_user_instrument_id" on "cucb"."gigs_lineups_instruments" ("user_instrument_id", "user_id");',
    );
    this.addSql('create index "idx_17435_gig_id" on "cucb"."gigs_lineups_instruments" ("gig_id", "user_id");');

    this.addSql(
      'create table "cucb"."users_instruments_connections" ("id" bigserial primary key, "user_instrument_id" bigint not null, "conn_id" bigint not null);',
    );
    this.addSql(
      'create index "idx_17532_user_instrument_id" on "cucb"."users_instruments_connections" ("user_instrument_id");',
    );
    this.addSql('create index "idx_17532_conn_id" on "cucb"."users_instruments_connections" ("conn_id");');

    this.addSql(
      'create table "cucb"."user_pref_types" ("id" bigserial primary key, "name" varchar(250) not null, "default" boolean not null);',
    );
    this.addSql('alter table "cucb"."user_pref_types" add constraint "idx_17551_name" unique ("name");');

    this.addSql(
      'create table "cucb"."user_prefs" ("user_id" bigint not null, "pref_id" bigint not null, "value" boolean not null, constraint "user_prefs_pkey" primary key ("user_id", "pref_id"));',
    );
    this.addSql('create index "idx_17543_pref_id" on "cucb"."user_prefs" ("pref_id");');
    this.addSql('alter table "cucb"."user_prefs" add constraint "idx_17543_userpref" unique ("user_id", "pref_id");');

    this.addSql(
      'alter table "cucb"."auth_action_types" add constraint "auth_action_types_auth_bitmask_foreign" foreign key ("auth_bitmask") references "cucb"."auth_bitmasks_permissions" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "cucb"."committee_members" add constraint "committee_members_position_foreign" foreign key ("position") references "cucb"."committee_positions" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "cucb"."committee_members" add constraint "committee_members_committee_foreign" foreign key ("committee") references "cucb"."committees" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "cucb"."committee_members" add constraint "committee_members_lookup_name_foreign" foreign key ("lookup_name") references "cucb"."committee_keys" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "cucb"."instruments" add constraint "instruments_parent_id_foreign" foreign key ("parent_id") references "cucb"."instruments" ("id") on update set null on delete set null;',
    );

    this.addSql(
      'alter table "cucb"."music" add constraint "music_type_foreign" foreign key ("type") references "cucb"."music_types" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "cucb"."users" add constraint "users_admin_foreign" foreign key ("admin") references "cucb"."auth_user_types" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "cucb"."session_tunes" add constraint "session_tunes_type_foreign" foreign key ("type") references "cucb"."music_types" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "cucb"."session_tunes" add constraint "session_tunes_contributor_foreign" foreign key ("contributor") references "cucb"."users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "cucb"."news" add constraint "news_posted_by_foreign" foreign key ("posted_by") references "cucb"."users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "cucb"."gigs" add constraint "gigs_type_foreign" foreign key ("type") references "cucb"."gig_types" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "cucb"."gigs" add constraint "gigs_venue_id_foreign" foreign key ("venue_id") references "cucb"."gig_venues" ("id") on update cascade on delete set null;',
    );
    this.addSql(
      'alter table "cucb"."gigs" add constraint "gigs_posting_user_foreign" foreign key ("posting_user") references "cucb"."users" ("id") on update cascade on delete set null;',
    );
    this.addSql(
      'alter table "cucb"."gigs" add constraint "gigs_editing_user_foreign" foreign key ("editing_user") references "cucb"."users" ("id") on update cascade on delete set null;',
    );

    this.addSql(
      'alter table "cucb"."gigs_lineups" add constraint "gigs_lineups_gig_id_foreign" foreign key ("gig_id") references "cucb"."gigs" ("id") on update cascade on delete cascade;',
    );
    this.addSql(
      'alter table "cucb"."gigs_lineups" add constraint "gigs_lineups_user_id_foreign" foreign key ("user_id") references "cucb"."users" ("id") on update cascade on delete cascade;',
    );

    this.addSql(
      'alter table "cucb"."contacts" add constraint "contacts_user_id_foreign" foreign key ("user_id") references "cucb"."users" ("id") on update cascade on delete cascade;',
    );

    this.addSql(
      'alter table "cucb"."gigs_contacts" add constraint "gigs_contacts_gig_id_foreign" foreign key ("gig_id") references "cucb"."gigs" ("id") on update cascade on delete cascade;',
    );
    this.addSql(
      'alter table "cucb"."gigs_contacts" add constraint "gigs_contacts_contact_id_foreign" foreign key ("contact_id") references "cucb"."contacts" ("id") on update cascade on delete cascade;',
    );

    this.addSql(
      'alter table "cucb"."calendar_subscriptions" add constraint "calendar_subscriptions_user_id_foreign" foreign key ("user_id") references "cucb"."users" ("id") on update cascade on delete cascade;',
    );

    this.addSql(
      'alter table "cucb"."biscuit_polls" add constraint "biscuit_polls_created_by_foreign" foreign key ("created_by") references "cucb"."users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "cucb"."biscuit_poll_entries" add constraint "biscuit_poll_entries_poll_foreign" foreign key ("poll") references "cucb"."biscuit_polls" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "cucb"."biscuit_poll_entries" add constraint "biscuit_poll_entries_added_by_foreign" foreign key ("added_by") references "cucb"."users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "cucb"."biscuit_poll_votes" add constraint "biscuit_poll_votes_user_foreign" foreign key ("user") references "cucb"."users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "cucb"."biscuit_poll_votes" add constraint "biscuit_poll_votes_vote_for_foreign" foreign key ("vote_for") references "cucb"."biscuit_poll_entries" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "cucb"."auth_tokens" add constraint "auth_tokens_user_id_foreign" foreign key ("user_id") references "cucb"."users" ("id") on update cascade on delete cascade;',
    );

    this.addSql(
      'alter table "cucb"."users_instruments" add constraint "users_instruments_user_id_foreign" foreign key ("user_id") references "cucb"."users" ("id") on update cascade on delete cascade;',
    );
    this.addSql(
      'alter table "cucb"."users_instruments" add constraint "users_instruments_instr_id_foreign" foreign key ("instr_id") references "cucb"."instruments" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "cucb"."gigs_lineups_instruments" add constraint "gigs_lineups_instruments_user_instrument_id_foreign" foreign key ("user_instrument_id") references "cucb"."users_instruments" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "cucb"."gigs_lineups_instruments" add constraint "gigs_lineups_instruments_gig_id_user_id_foreign" foreign key ("gig_id", "user_id") references "cucb"."gigs_lineups" ("gig_id", "user_id") on update cascade on delete cascade;',
    );

    this.addSql(
      'alter table "cucb"."users_instruments_connections" add constraint "users_instruments_connections_user_instrument_id_foreign" foreign key ("user_instrument_id") references "cucb"."users_instruments" ("id") on update cascade on delete cascade;',
    );
    this.addSql(
      'alter table "cucb"."users_instruments_connections" add constraint "users_instruments_connections_conn_id_foreign" foreign key ("conn_id") references "cucb"."connection_types" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "cucb"."user_prefs" add constraint "user_prefs_user_id_foreign" foreign key ("user_id") references "cucb"."users" ("id") on update cascade on delete cascade;',
    );
    this.addSql(
      'alter table "cucb"."user_prefs" add constraint "user_prefs_pref_id_foreign" foreign key ("pref_id") references "cucb"."user_pref_types" ("id") on update cascade;',
    );
  }
}
exports.Migration20221225070638 = Migration20221225070638;
