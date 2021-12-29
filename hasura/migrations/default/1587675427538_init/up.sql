CREATE SCHEMA cucb;
CREATE TYPE cucb.calendar_subscriptions_calendar_type AS ENUM (
    'allgigs',
    'mygigs'
);
CREATE TYPE cucb.photos_filetype AS ENUM (
    'jpeg',
    'mov'
);
CREATE TABLE cucb.auth_action_types (
    id bigint NOT NULL,
    description character varying(255) NOT NULL,
    auth_bitmask bigint NOT NULL
);
CREATE SEQUENCE cucb.auth_action_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.auth_action_types_id_seq OWNED BY cucb.auth_action_types.id;
CREATE TABLE cucb.auth_bitmasks_permissions (
    id bigint NOT NULL,
    php_title character varying(255) NOT NULL,
    bitmask bigint NOT NULL
);
CREATE SEQUENCE cucb.auth_bitmasks_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.auth_bitmasks_permissions_id_seq OWNED BY cucb.auth_bitmasks_permissions.id;
CREATE TABLE cucb.auth_tokens (
    id bigint NOT NULL,
    hash character varying(255) NOT NULL,
    user_id bigint NOT NULL,
    expires timestamp with time zone NOT NULL,
    device_id character varying(255) NOT NULL
);
CREATE SEQUENCE cucb.auth_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.auth_tokens_id_seq OWNED BY cucb.auth_tokens.id;
CREATE TABLE cucb.auth_user_types (
    id bigint NOT NULL,
    title character varying(255) NOT NULL,
    php_title character varying(255) NOT NULL,
    hasura_role character varying NOT NULL
);
CREATE SEQUENCE cucb.auth_user_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.auth_user_types_id_seq OWNED BY cucb.auth_user_types.id;
CREATE TABLE cucb.biscuit_poll_entries (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    poll bigint NOT NULL,
    added_at timestamp with time zone DEFAULT now() NOT NULL,
    added_by bigint NOT NULL
);
CREATE SEQUENCE cucb.biscuit_poll_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.biscuit_poll_entries_id_seq OWNED BY cucb.biscuit_poll_entries.id;
CREATE TABLE cucb.biscuit_poll_votes (
    id bigint NOT NULL,
    "user" bigint NOT NULL,
    cast_at timestamp with time zone DEFAULT now() NOT NULL,
    vote_for bigint NOT NULL
);
CREATE SEQUENCE cucb.biscuit_poll_votes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.biscuit_poll_votes_id_seq OWNED BY cucb.biscuit_poll_votes.id;
CREATE TABLE cucb.biscuit_polls (
    id bigint NOT NULL,
    created_by bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    open boolean DEFAULT true NOT NULL,
    archived boolean DEFAULT false NOT NULL,
    rehearsal_date date
);
CREATE SEQUENCE cucb.biscuit_polls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.biscuit_polls_id_seq OWNED BY cucb.biscuit_polls.id;
CREATE TABLE cucb.calendar_subscriptions (
    user_id bigint NOT NULL,
    calendar_type cucb.calendar_subscriptions_calendar_type NOT NULL,
    last_accessed timestamp with time zone NOT NULL,
    ip_address character varying(64) NOT NULL
);
CREATE TABLE cucb.captions (
    captionid bigint NOT NULL,
    userid bigint,
    photo character varying(20),
    text bytea,
    "time" timestamp with time zone,
    dirid bigint,
    photoid bigint
);
CREATE SEQUENCE cucb.captions_captionid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.captions_captionid_seq OWNED BY cucb.captions.captionid;
CREATE TABLE cucb.committee_keys (
    id bigint NOT NULL,
    name character varying(255) NOT NULL
);
CREATE SEQUENCE cucb.committee_keys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.committee_keys_id_seq OWNED BY cucb.committee_keys.id;
CREATE TABLE cucb.committee_members (
    id bigint NOT NULL,
    "position" bigint NOT NULL,
    name character varying(255) NOT NULL,
    casual_name character varying(255) NOT NULL,
    crsid character varying(10),
    email character varying(255),
    email_obfus character varying(255),
    pic character varying(255),
    committee bigint NOT NULL,
    lookup_name bigint NOT NULL,
    april_fools_only boolean DEFAULT false NOT NULL,
    comments character varying(255),
    hidden boolean DEFAULT false NOT NULL,
    april_fools_dir character varying(255),
    sub_position character varying(255)
);
CREATE SEQUENCE cucb.committee_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.committee_members_id_seq OWNED BY cucb.committee_members.id;
CREATE TABLE cucb.committee_positions (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    "position" bigint NOT NULL
);
CREATE SEQUENCE cucb.committee_positions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.committee_positions_id_seq OWNED BY cucb.committee_positions.id;
CREATE TABLE cucb.committees (
    id bigint NOT NULL,
    started timestamp with time zone NOT NULL,
    pic_folder character varying(255)
);
CREATE SEQUENCE cucb.committees_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.committees_id_seq OWNED BY cucb.committees.id;
CREATE TABLE cucb.connection_types (
    id bigint NOT NULL,
    name character varying(30),
    icon_name character varying(32) NOT NULL
);
CREATE SEQUENCE cucb.connection_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.connection_types_id_seq OWNED BY cucb.connection_types.id;
CREATE TABLE cucb.contacts (
    id bigint NOT NULL,
    user_id bigint,
    name character varying(128) NOT NULL,
    email character varying(255),
    organization character varying(255),
    caller boolean DEFAULT false NOT NULL,
    notes text
);
CREATE SEQUENCE cucb.contacts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.contacts_id_seq OWNED BY cucb.contacts.id;
CREATE TABLE cucb.galleries (
    id integer NOT NULL,
    description text NOT NULL,
    secure boolean NOT NULL,
    attribution character varying(512)
);
CREATE TABLE cucb.gig_types (
    id bigint NOT NULL,
    code character varying(16) NOT NULL,
    title character varying(128) NOT NULL
);
CREATE SEQUENCE cucb.gig_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.gig_types_id_seq OWNED BY cucb.gig_types.id;
CREATE TABLE cucb.gig_venues (
    id bigint NOT NULL,
    name character varying(256) NOT NULL,
    subvenue character varying(256),
    map_link character varying(1024),
    distance_miles bigint,
    notes_admin text,
    notes_band text,
    address character varying(255),
    postcode character varying(32),
    latitude double precision,
    longitude double precision
);
CREATE SEQUENCE cucb.gig_venues_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.gig_venues_id_seq OWNED BY cucb.gig_venues.id;
CREATE TABLE cucb.gigs (
    id bigint NOT NULL,
    title character varying(128) NOT NULL,
    type bigint NOT NULL,
    date date,
    "time" time without time zone,
    arrive_time timestamp with time zone,
    finish_time timestamp with time zone,
    venue_id bigint,
    posting_user bigint,
    posting_time timestamp with time zone DEFAULT now(),
    editing_user bigint,
    editing_time timestamp with time zone,
    summary text,
    quote_date date,
    finance text,
    finance_deposit_received boolean DEFAULT false,
    finance_payment_received boolean DEFAULT false,
    finance_caller_paid boolean DEFAULT false,
    notes_band text,
    notes_admin text,
    advertise boolean DEFAULT false NOT NULL,
    admins_only boolean DEFAULT true NOT NULL,
    allow_signups boolean DEFAULT false NOT NULL
);
CREATE TABLE cucb.gigs_contacts (
    gig_id bigint NOT NULL,
    contact_id bigint DEFAULT '0'::bigint NOT NULL,
    notes text,
    calling boolean DEFAULT false NOT NULL,
    client boolean DEFAULT true NOT NULL
);
CREATE SEQUENCE cucb.gigs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.gigs_id_seq OWNED BY cucb.gigs.id;
CREATE TABLE cucb.gigs_lineups (
    id bigint NOT NULL,
    gig_id bigint NOT NULL,
    user_id bigint NOT NULL,
    adding_time timestamp with time zone,
    editing_time timestamp with time zone,
    approved boolean,
    equipment boolean DEFAULT false NOT NULL,
    leader boolean DEFAULT false NOT NULL,
    driver boolean DEFAULT false NOT NULL,
    money_collector boolean DEFAULT false NOT NULL,
    money_collector_notified boolean DEFAULT false NOT NULL,
    user_notes text,
    user_available boolean,
    user_only_if_necessary boolean,
    admin_notes text
);
CREATE SEQUENCE cucb.gigs_lineups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.gigs_lineups_id_seq OWNED BY cucb.gigs_lineups.id;
CREATE TABLE cucb.gigs_lineups_instruments (
    gig_id bigint NOT NULL,
    user_id bigint NOT NULL,
    user_instrument_id bigint NOT NULL,
    approved boolean
);
CREATE TABLE cucb.instruments (
    id bigint NOT NULL,
    name character varying(128) NOT NULL,
    novelty boolean DEFAULT false NOT NULL,
    parent_only boolean DEFAULT false NOT NULL,
    parent_id bigint
);
CREATE SEQUENCE cucb.instruments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.instruments_id_seq OWNED BY cucb.instruments.id;
CREATE TABLE cucb.music (
    id bigint NOT NULL,
    title character varying(128) NOT NULL,
    filename character varying(128) NOT NULL,
    type bigint NOT NULL,
    current boolean DEFAULT true NOT NULL,
    show_tune boolean DEFAULT false NOT NULL
);
CREATE SEQUENCE cucb.music_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.music_id_seq OWNED BY cucb.music.id;
CREATE TABLE cucb.music_types (
    id bigint NOT NULL,
    abc_field character varying(32) NOT NULL,
    name character varying(32) NOT NULL,
    description text NOT NULL,
    common_type boolean DEFAULT false NOT NULL
);
CREATE SEQUENCE cucb.music_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.music_types_id_seq OWNED BY cucb.music_types.id;
CREATE TABLE cucb.news (
    id bigint NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    posted timestamp with time zone,
    posted_by bigint NOT NULL
);
CREATE SEQUENCE cucb.news_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.news_id_seq OWNED BY cucb.news.id;
CREATE TABLE cucb.photos (
    photoid bigint NOT NULL,
    filename character varying(120),
    filetype cucb.photos_filetype DEFAULT 'jpeg'::cucb.photos_filetype NOT NULL,
    path character varying(40),
    thumbnail character varying(100),
    taken_by bigint
);
CREATE SEQUENCE cucb.photos_photoid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.photos_photoid_seq OWNED BY cucb.photos.photoid;
CREATE TABLE cucb.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);
CREATE TABLE cucb.session_tunes (
    id bigint NOT NULL,
    title character varying(255),
    filename character varying(255),
    type bigint NOT NULL,
    touched date NOT NULL,
    contributor bigint NOT NULL,
    contributed_date date NOT NULL,
    contributor_notes text,
    other_notes text,
    hidden boolean DEFAULT false NOT NULL
);
CREATE SEQUENCE cucb.session_tunes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.session_tunes_id_seq OWNED BY cucb.session_tunes.id;
CREATE TABLE cucb.songs (
    id bigint NOT NULL,
    name character varying(64) NOT NULL,
    filename character varying(64) NOT NULL,
    tuneid bigint DEFAULT '0'::bigint NOT NULL,
    new smallint DEFAULT '1'::smallint NOT NULL
);
CREATE SEQUENCE cucb.songs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.songs_id_seq OWNED BY cucb.songs.id;
CREATE TABLE cucb.user_password_resets (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    datetime timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE cucb.user_password_resets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.user_password_resets_id_seq OWNED BY cucb.user_password_resets.id;
CREATE TABLE cucb.user_pref_types (
    id bigint NOT NULL,
    name character varying(250) NOT NULL,
    "default" boolean NOT NULL
);
CREATE SEQUENCE cucb.user_pref_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.user_pref_types_id_seq OWNED BY cucb.user_pref_types.id;
CREATE TABLE cucb.user_prefs (
    user_id bigint NOT NULL,
    pref_id bigint NOT NULL,
    value boolean NOT NULL
);
CREATE TABLE cucb.users (
    id bigint NOT NULL,
    admin integer DEFAULT 9 NOT NULL,
    first character varying(64),
    last character varying(64),
    username character varying(255) NOT NULL,
    password character varying(40),
    salted_password character varying(255),
    email character varying(255) NOT NULL,
    join_date timestamp with time zone,
    last_login_date timestamp with time zone,
    mobile_contact_info character varying(255),
    location_info character varying(512),
    dietaries character varying(512),
    bio text,
    bio_changed_date timestamp with time zone,
    password_reset_token character varying(255),
    password_reset_deadline timestamp with time zone
);
CREATE SEQUENCE cucb.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.users_id_seq OWNED BY cucb.users.id;
CREATE TABLE cucb.users_instruments (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    instr_id bigint NOT NULL,
    nickname character varying(128),
    deleted boolean DEFAULT false NOT NULL
);
CREATE TABLE cucb.users_instruments_connections (
    id bigint NOT NULL,
    user_instrument_id bigint NOT NULL,
    conn_id bigint NOT NULL
);
CREATE SEQUENCE cucb.users_instruments_connections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.users_instruments_connections_id_seq OWNED BY cucb.users_instruments_connections.id;
CREATE SEQUENCE cucb.users_instruments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cucb.users_instruments_id_seq OWNED BY cucb.users_instruments.id;
ALTER TABLE ONLY cucb.auth_action_types ALTER COLUMN id SET DEFAULT nextval('cucb.auth_action_types_id_seq'::regclass);
ALTER TABLE ONLY cucb.auth_bitmasks_permissions ALTER COLUMN id SET DEFAULT nextval('cucb.auth_bitmasks_permissions_id_seq'::regclass);
ALTER TABLE ONLY cucb.auth_tokens ALTER COLUMN id SET DEFAULT nextval('cucb.auth_tokens_id_seq'::regclass);
ALTER TABLE ONLY cucb.auth_user_types ALTER COLUMN id SET DEFAULT nextval('cucb.auth_user_types_id_seq'::regclass);
ALTER TABLE ONLY cucb.biscuit_poll_entries ALTER COLUMN id SET DEFAULT nextval('cucb.biscuit_poll_entries_id_seq'::regclass);
ALTER TABLE ONLY cucb.biscuit_poll_votes ALTER COLUMN id SET DEFAULT nextval('cucb.biscuit_poll_votes_id_seq'::regclass);
ALTER TABLE ONLY cucb.biscuit_polls ALTER COLUMN id SET DEFAULT nextval('cucb.biscuit_polls_id_seq'::regclass);
ALTER TABLE ONLY cucb.captions ALTER COLUMN captionid SET DEFAULT nextval('cucb.captions_captionid_seq'::regclass);
ALTER TABLE ONLY cucb.committee_keys ALTER COLUMN id SET DEFAULT nextval('cucb.committee_keys_id_seq'::regclass);
ALTER TABLE ONLY cucb.committee_members ALTER COLUMN id SET DEFAULT nextval('cucb.committee_members_id_seq'::regclass);
ALTER TABLE ONLY cucb.committee_positions ALTER COLUMN id SET DEFAULT nextval('cucb.committee_positions_id_seq'::regclass);
ALTER TABLE ONLY cucb.committees ALTER COLUMN id SET DEFAULT nextval('cucb.committees_id_seq'::regclass);
ALTER TABLE ONLY cucb.connection_types ALTER COLUMN id SET DEFAULT nextval('cucb.connection_types_id_seq'::regclass);
ALTER TABLE ONLY cucb.contacts ALTER COLUMN id SET DEFAULT nextval('cucb.contacts_id_seq'::regclass);
ALTER TABLE ONLY cucb.gig_types ALTER COLUMN id SET DEFAULT nextval('cucb.gig_types_id_seq'::regclass);
ALTER TABLE ONLY cucb.gig_venues ALTER COLUMN id SET DEFAULT nextval('cucb.gig_venues_id_seq'::regclass);
ALTER TABLE ONLY cucb.gigs ALTER COLUMN id SET DEFAULT nextval('cucb.gigs_id_seq'::regclass);
ALTER TABLE ONLY cucb.gigs_lineups ALTER COLUMN id SET DEFAULT nextval('cucb.gigs_lineups_id_seq'::regclass);
ALTER TABLE ONLY cucb.instruments ALTER COLUMN id SET DEFAULT nextval('cucb.instruments_id_seq'::regclass);
ALTER TABLE ONLY cucb.music ALTER COLUMN id SET DEFAULT nextval('cucb.music_id_seq'::regclass);
ALTER TABLE ONLY cucb.music_types ALTER COLUMN id SET DEFAULT nextval('cucb.music_types_id_seq'::regclass);
ALTER TABLE ONLY cucb.news ALTER COLUMN id SET DEFAULT nextval('cucb.news_id_seq'::regclass);
ALTER TABLE ONLY cucb.photos ALTER COLUMN photoid SET DEFAULT nextval('cucb.photos_photoid_seq'::regclass);
ALTER TABLE ONLY cucb.session_tunes ALTER COLUMN id SET DEFAULT nextval('cucb.session_tunes_id_seq'::regclass);
ALTER TABLE ONLY cucb.songs ALTER COLUMN id SET DEFAULT nextval('cucb.songs_id_seq'::regclass);
ALTER TABLE ONLY cucb.user_password_resets ALTER COLUMN id SET DEFAULT nextval('cucb.user_password_resets_id_seq'::regclass);
ALTER TABLE ONLY cucb.user_pref_types ALTER COLUMN id SET DEFAULT nextval('cucb.user_pref_types_id_seq'::regclass);
ALTER TABLE ONLY cucb.users ALTER COLUMN id SET DEFAULT nextval('cucb.users_id_seq'::regclass);
ALTER TABLE ONLY cucb.users_instruments ALTER COLUMN id SET DEFAULT nextval('cucb.users_instruments_id_seq'::regclass);
ALTER TABLE ONLY cucb.users_instruments_connections ALTER COLUMN id SET DEFAULT nextval('cucb.users_instruments_connections_id_seq'::regclass);

--
-- Insert data from
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.17
-- Dumped by pg_dump version 10.12

--
-- Data for Name: auth_bitmasks_permissions; Type: TABLE DATA; Schema: cucb; Owner: cucb
--

INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (1, 'AUTH_VIEW_HIDDEN_GIGS', 127);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (2, 'AUTH_VIEW_LINEUP_APPLICATIONS', 7);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (3, 'AUTH_EDIT_GIGS', 95);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (4, 'AUTH_MANAGE_OTHER_USERS', 95);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (5, 'AUTH_VIEW_ADMIN_NOTES', 95);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (6, 'AUTH_VIEW_CONTACTS', 127);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (7, 'AUTH_VIEW_FINANCE', 95);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (8, 'AUTH_EMAIL_LINEUP', 127);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (9, 'AUTH_EDIT_LINEUP', 3);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (10, 'AUTH_EMAIL_LISTS', 95);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (11, 'AUTH_MODERATE_FORUM', 95);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (12, 'AUTH_CHANGE_ADMIN_STATE', 1);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (13, 'AUTH_ADMINISTRATE_WEBSITE', 1);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (14, 'AUTH_NORMAL_RIGHTS', 1407);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (15, 'AUTH_VIEW_MUSIC', 1535);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (16, 'AUTH_AS_NORMAL_USER', 1151);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (17, 'AUTH_EDIT_SESSION_TUNES', 95);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (18, 'AUTH_VIEW_GIGS_NEEDING_ATTENTION', 7);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (19, 'AUTH_MANAGE_USER_INSTRUMENT_INFO', 23);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (20, 'AUTH_ANYBODY', 2047);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (21, 'AUTH_NOT_LOGGED_IN', 512);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (22, 'AUTH_MUSIC_ONLY', 128);
INSERT INTO cucb.auth_bitmasks_permissions (id, php_title, bitmask) VALUES (23, 'AUTH_CREATE_BISCUIT_POLL', 1025);


--
-- Data for Name: auth_action_types; Type: TABLE DATA; Schema: cucb; Owner: cucb
--

INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (1, 'Whether ''blue gigs'' can be viewed.', 1);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (2, 'Whether the state, notes and instruments of lineup applications can be viewed - includes ability to view and edit admin notes on lineup applications!', 2);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (3, 'Grants all rights to edit gigs, but none regarding choosing lineups or viewing lineup applications.', 3);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (4, 'Whether can edit other users'' settings (and see this display!).', 4);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (5, 'Whether various admin notes can be viewed, including notes on gigs and venues. (Does not apply to lineup applications!)', 5);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (6, 'Whether allowed to see contact names on gigs.', 6);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (7, 'Whether the user can see the financial details of gigs.', 7);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (8, 'Whether the e-mail addresses of lineups are available, and can use website to send messages to them.', 8);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (9, 'Whether can select/edit lineups.', 9);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (10, 'Whether given ability to directly e-mail mailing lists from the website.', 10);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (11, 'Whether can moderate the messageboard, deleting messages etc.', 11);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (12, 'Whether can change the privileges of other users.', 12);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (13, 'Catch-all for things only a webmaster should be allowed to do.', 13);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (14, 'Gives normal user abilities: being able to view members'' pages, being eligible for signups, etc. - cf. Music Only.', 14);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (15, 'Whether allowed to see our fantastic music collection.', 15);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (16, 'Whether to allow users to view things "as normal users".', 16);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (17, 'Whether allowed to edit session tunes uploaded by other people.', 17);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (18, 'Whether gig diary presents gigs enquiries needing chasing/callers booking.', 18);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (19, 'Whether user can view and edit users'' instrument info, in particular connection types. (Should be granted if can manage other users.)', 19);
INSERT INTO cucb.auth_action_types (id, description, auth_bitmask) VALUES (20, 'Whether biscuit polls can be created', 23);


--
-- Data for Name: auth_user_types; Type: TABLE DATA; Schema: cucb; Owner: cucb
--

INSERT INTO cucb.auth_user_types (id, title, php_title, hasura_role) VALUES (1, 'Administrator', 'ADMIN_STATUS_FULL', 'webmaster');
INSERT INTO cucb.auth_user_types (id, title, php_title, hasura_role) VALUES (2, 'President', 'ADMIN_STATUS_PRESIDENT', 'president');
INSERT INTO cucb.auth_user_types (id, title, php_title, hasura_role) VALUES (3, 'Secretary', 'ADMIN_STATUS_SECRETARY', 'secretary');
INSERT INTO cucb.auth_user_types (id, title, php_title, hasura_role) VALUES (4, 'Treasurer', 'ADMIN_STATUS_TREASURER', 'treasurer');
INSERT INTO cucb.auth_user_types (id, title, php_title, hasura_role) VALUES (5, 'Equipment Officer', 'ADMIN_STATUS_EQUIPMENT', 'equipment');
INSERT INTO cucb.auth_user_types (id, title, php_title, hasura_role) VALUES (6, 'Blue Gig Authorized', 'ADMIN_STATUS_HIDDEN_AUTH', 'blue_gig');
INSERT INTO cucb.auth_user_types (id, title, php_title, hasura_role) VALUES (7, 'Gig Editor', 'ADMIN_STATUS_GIG_EDITOR', 'gig_editor');
INSERT INTO cucb.auth_user_types (id, title, php_title, hasura_role) VALUES (8, 'Music Only', 'ADMIN_STATUS_MUSIC_ONLY', 'music_only');
INSERT INTO cucb.auth_user_types (id, title, php_title, hasura_role) VALUES (9, 'Normal User', 'ADMIN_STATUS_NONE', 'user');
INSERT INTO cucb.auth_user_types (id, title, php_title, hasura_role) VALUES (11, 'General Member', 'ADMIN_STATUS_GENERAL_MEMBER', 'general_member');
INSERT INTO cucb.auth_user_types (id, title, php_title, hasura_role) VALUES (10, 'Non Member', 'ADMIN_STATUS_NO_AUTH', 'no_auth');

--
-- Data for Name: calendar_subscriptions; Type: TABLE DATA; Schema: cucb; Owner: cucb
--



--
-- Data for Name: captions; Type: TABLE DATA; Schema: cucb; Owner: cucb
--



--
-- Data for Name: committee_keys; Type: TABLE DATA; Schema: cucb; Owner: cucb
--

INSERT INTO cucb.committee_keys (id, name) VALUES (1, 'president');
INSERT INTO cucb.committee_keys (id, name) VALUES (2, 'secretary');
INSERT INTO cucb.committee_keys (id, name) VALUES (3, 'treasurer');
INSERT INTO cucb.committee_keys (id, name) VALUES (4, 'social');
INSERT INTO cucb.committee_keys (id, name) VALUES (5, 'logistics');
INSERT INTO cucb.committee_keys (id, name) VALUES (6, 'equipment');
INSERT INTO cucb.committee_keys (id, name) VALUES (7, 'tour');
INSERT INTO cucb.committee_keys (id, name) VALUES (8, 'webmaster');
INSERT INTO cucb.committee_keys (id, name) VALUES (10, 'webmaster1');
INSERT INTO cucb.committee_keys (id, name) VALUES (11, 'webmaster2');
INSERT INTO cucb.committee_keys (id, name) VALUES (12, 'genmember1');
INSERT INTO cucb.committee_keys (id, name) VALUES (13, 'genmember2');
INSERT INTO cucb.committee_keys (id, name) VALUES (14, 'genmember3');
INSERT INTO cucb.committee_keys (id, name) VALUES (15, 'genmember4');


--
-- Data for Name: committee_positions; Type: TABLE DATA; Schema: cucb; Owner: cucb
--

INSERT INTO cucb.committee_positions (id, name, "position") VALUES (1, 'President', 5);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (2, 'Secretary', 10);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (3, 'Treasurer', 15);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (4, 'Social Secretary', 20);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (5, 'Equipment Officer', 30);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (6, 'Logistics Officer', 25);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (7, 'Tour Secretary', 35);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (8, 'Webmaster', 40);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (9, 'General Member', 45);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (10, 'Equipment Helper', 50);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (11, 'Musical Director', 55);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (12, 'Presidential Administrator', 7);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (13, 'Tour Organiser', 35);
INSERT INTO cucb.committee_positions (id, name, "position") VALUES (14, 'Generally Helpful Person', 45);


--
-- Data for Name: committees; Type: TABLE DATA; Schema: cucb; Owner: cucb
--


--
-- Data for Name: committee_members; Type: TABLE DATA; Schema: cucb; Owner: cucb
--


--
-- Data for Name: connection_types; Type: TABLE DATA; Schema: cucb; Owner: cucb
--

INSERT INTO cucb.connection_types (id, name, icon_name) VALUES (1, 'Unknown', 'question-mark');
INSERT INTO cucb.connection_types (id, name, icon_name) VALUES (2, 'Microphone + XLR', 'mic');
INSERT INTO cucb.connection_types (id, name, icon_name) VALUES (3, 'Pickup + Jack', 'pickup-jack');
INSERT INTO cucb.connection_types (id, name, icon_name) VALUES (4, 'Pickup + XLR', 'pickup-xlr');
INSERT INTO cucb.connection_types (id, name, icon_name) VALUES (5, 'Jack (Band)', 'jack');
INSERT INTO cucb.connection_types (id, name, icon_name) VALUES (6, 'Jack (Own)', 'jack-own');
INSERT INTO cucb.connection_types (id, name, icon_name) VALUES (7, 'Radio Mic (XLR)', 'xlr');
INSERT INTO cucb.connection_types (id, name, icon_name) VALUES (8, 'XLR (Band)', 'xlr');
INSERT INTO cucb.connection_types (id, name, icon_name) VALUES (9, 'XLR (Own)', 'xlr-own');



--
-- Data for Name: gig_types; Type: TABLE DATA; Schema: cucb; Owner: cucb
--

INSERT INTO cucb.gig_types (id, code, title) VALUES (1, 'gig', 'Gig');
INSERT INTO cucb.gig_types (id, code, title) VALUES (2, 'gig_enquiry', 'Gig Enquiry');
INSERT INTO cucb.gig_types (id, code, title) VALUES (3, 'gig_cancelled', 'Cancelled Gig');
INSERT INTO cucb.gig_types (id, code, title) VALUES (6, 'kit', 'Kit Borrowing');
INSERT INTO cucb.gig_types (id, code, title) VALUES (7, 'calendar', 'Calendar Dates');
INSERT INTO cucb.gig_types (id, code, title) VALUES (8, 'draft', '[DRAFT]');


--
-- Data for Name: instruments; Type: TABLE DATA; Schema: cucb; Owner: cucb
--

INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (1, 'Fiddle', false, false, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (2, 'Anglo Hardingfele', false, false, 1);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (3, 'Viola', false, false, 93);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (4, 'Banjo', false, false, 96);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (5, 'Tenor Banjo', false, false, 96);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (6, 'Bouzouki', false, false, 96);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (7, 'Mandolin', false, false, 96);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (8, 'Ukulele', false, false, 96);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (9, 'Tenor Guitar', false, false, 96);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (10, 'Timple', false, false, 96);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (11, 'Charango', false, false, 96);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (12, 'Harp', false, false, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (13, 'Lever Harp', false, false, 12);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (14, 'Flute', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (15, 'Baroque Flute', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (16, 'Recorder(s)', false, false, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (17, 'Descant Recorder', false, false, 16);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (18, 'Tenor Recorder', false, false, 16);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (19, 'Bass Recorder', false, false, 16);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (20, 'Wind Synth', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (21, 'Mouth Organ', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (22, 'Bodhran', false, false, 27);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (23, 'Drum(s)', false, false, 27);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (24, 'Hand-Drum', false, false, 27);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (25, 'Table Drum', false, false, 27);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (26, 'Cajón', false, false, 27);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (27, 'Percussion', false, false, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (28, 'Djembe', false, false, 27);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (29, 'Clarinet', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (30, 'Accordion', false, false, 99);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (31, 'Melodeon', false, false, 99);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (32, 'Concertina', false, false, 99);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (33, 'English Concertina', false, false, 99);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (34, 'Piano Accordion', false, false, 99);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (35, 'British Chromatic Accordion', false, false, 99);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (36, 'Guitar', false, false, 96);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (37, 'Bass Guitar', false, false, 96);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (38, 'Whistle(s)', false, false, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (39, 'Low Whistle(s)', false, false, 38);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (40, 'High Whistle(s)', false, false, 38);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (41, 'Cello', false, false, 93);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (42, 'Electric Cello', false, false, 93);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (43, 'Double Bass', false, false, 93);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (44, 'Piano', false, false, 45);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (45, 'Keyboards', false, false, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (46, 'Piccolo', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (47, 'Oboe', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (48, 'Bassoon', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (49, 'Xaphoon', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (50, 'Bombarde', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (51, 'Trumpet', false, false, 91);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (52, 'Cornet', false, false, 91);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (53, 'Trombone', false, false, 91);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (54, 'Tuba', false, false, 91);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (55, 'Tenor Saxophone', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (56, 'Alto Saxophone', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (57, 'Baritone Saxophone', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (58, 'Bagpipes', false, false, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (59, 'Smallpipes', false, false, 58);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (60, 'Scottish Smallpipes (A)', false, false, 58);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (61, 'Great Highland Bagpipes', false, false, 58);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (62, 'Voice', false, false, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (63, 'Eigenharp', false, false, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (64, 'Kazoo', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (65, 'Novelty', true, true, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (66, 'Saxoflute', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (67, 'Wine Bottle', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (68, 'Hosepipe', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (69, 'Turnip', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (70, 'HTML Editor', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (71, 'Not the wine bottle', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (72, 'Most non fiddle instruments', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (73, 'Joy', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (74, 'It''s a little tricky on the cello...', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (75, 'Pie Charts', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (76, 'Egg Shaker', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (77, 'Evilness', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (78, 'More Loved', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (79, 'Hat', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (80, 'Stompin''', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (81, 'Mild Peril', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (82, 'Almost anything', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (83, 'But really badly', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (84, 'Something Portable', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (85, 'An Instrument Belonging To Someone Else', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (86, 'Instrument swapping', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (87, 'Secretary''s paperknife', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (88, 'Chequebook', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (89, 'Dancing!', true, false, 65);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (91, 'Other Brass', false, true, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (92, 'Other Wind', false, true, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (93, 'Other Strings', false, true, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (96, 'Guitar Family', false, true, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (99, 'Squeezebox', false, true, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (100, 'Soprano Saxophone', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (101, 'Autoharp', false, false, 12);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (102, 'Cuatro', false, false, 96);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (103, 'Hurdy Gurdy', false, false, 1);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (104, 'Cor Anglais', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (105, 'Pan Flute', false, false, 92);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (106, 'eMelodeon', false, false, 99);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (107, '', false, false, NULL);
INSERT INTO cucb.instruments (id, name, novelty, parent_only, parent_id) VALUES (108, 'Blade of grass', true, false, 65);

--
-- Data for Name: music_types; Type: TABLE DATA; Schema: cucb; Owner: cucb
--

INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (1, 'jig', 'Jig (32 bar)', '32 bar, 6/8 tunes, the staple of folk dance', true);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (2, 'reel', 'Reel (32 bar)', '32 bar, 4/4 tunes, and the standard tune type for walking-style dances', true);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (4, 'polka', 'Polka', 'Bouncy 2/4 tunes with strong upbeats', true);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (5, 'march', 'March', 'Fast walking-pace dance music, usually 2/4 or 4/4', false);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (6, 'hornpipe', 'Hornpipe', 'Music for hop-step dances, often played ''swung''', true);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (7, 'slip jig', 'Slip Jig', 'Tunes in 9/8 typically used for flowing ''unphrased'' dances', true);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (8, 'jig 48', 'Jig (48 bar)', 'Similar to normal jigs, but with dances half as long again', false);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (9, 'reel 48', 'Reel (48 bar)', 'Similar to normal reels, but with dances half as long again', false);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (10, 'schottische', 'Schottische', 'Angular 2/4 and 4/4 tunes, similar to polkas', false);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (11, 'slow reel', 'Slow Reel', 'Reels intended to be played notably slower than would be normal for dance for musical effect', false);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (12, 'air', 'Air', 'A free tune, written for listening rather than dance, commonly in 3/4', false);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (13, 'strathspey and reel', 'Strathspey & Reel', 'Used for dances which flow directly from a  strathspey (a special dance style) into a reel, but commonly played for musical effect', false);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (14, 'jig 5/8', '5/8 Jig', 'Jig-like tune with 5 beats to the bar, not generally for dancing', false);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (15, 'jig 7/8', '7/8 Jig', 'Jig-like tune with 7 beats to the bar, not generally for dancing', false);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (16, 'mixed', 'Mixed', 'Non-standard combinations of multiple tune types', false);
INSERT INTO cucb.music_types (id, abc_field, name, description, common_type) VALUES (3, 'waltz', 'Waltz', 'The familiar 3/4 dance style', true);


--
-- Data for Name: user_pref_types; Type: TABLE DATA; Schema: cucb; Owner: cucb
--

INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (1, 'style.fullscreen', false);
INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (2, 'style.gigs.twocol', false);
INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (3, 'attribute.driver', false);
INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (4, 'attribute.car', false);
INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (5, 'attribute.soundtech', false);
INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (6, 'attribute.leader', false);
INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (7, 'attribute.tshirt', false);
INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (8, 'attribute.folder', false);
INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (9, 'music.sortbytype', false);
INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (10, 'style.gigs.shownicknames', false);
INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (11, 'style.gigs.showconnections', false);
INSERT INTO cucb.user_pref_types (id, name, "default") VALUES (12, 'style.calendar.termly', true);

--
-- PostgreSQL database dump complete
--



ALTER TABLE ONLY cucb.auth_user_types
    ADD CONSTRAINT auth_user_types_hasura_role_key UNIQUE (hasura_role);
ALTER TABLE ONLY cucb.auth_action_types
    ADD CONSTRAINT cucb_auth_action_types_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.auth_bitmasks_permissions
    ADD CONSTRAINT cucb_auth_bitmasks_permissions_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.auth_tokens
    ADD CONSTRAINT cucb_auth_tokens_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.auth_user_types
    ADD CONSTRAINT cucb_auth_user_types_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.biscuit_polls
    ADD CONSTRAINT cucb_biscuit_polls_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.biscuit_poll_entries
    ADD CONSTRAINT cucb_biscuit_poll_entries_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.biscuit_poll_votes
    ADD CONSTRAINT cucb_biscuit_poll_votes_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.captions
    ADD CONSTRAINT cucb_captions_captionid_key PRIMARY KEY (captionid);
ALTER TABLE ONLY cucb.committees
    ADD CONSTRAINT cucb_committees_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.committee_keys
    ADD CONSTRAINT cucb_committee_keys_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.committee_members
    ADD CONSTRAINT cucb_committee_members_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.committee_positions
    ADD CONSTRAINT cucb_committee_positions_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.connection_types
    ADD CONSTRAINT cucb_connection_types_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.contacts
    ADD CONSTRAINT cucb_contacts_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.galleries
    ADD CONSTRAINT cucb_galleries_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.gigs
    ADD CONSTRAINT cucb_gigs_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.gigs_contacts
    ADD CONSTRAINT cucb_gigs_contacts_gig_id_contact_id_key PRIMARY KEY (gig_id, contact_id);
ALTER TABLE ONLY cucb.gigs_lineups
    ADD CONSTRAINT cucb_gigs_lineups_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.gig_types
    ADD CONSTRAINT cucb_gig_types_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.gig_venues
    ADD CONSTRAINT cucb_gig_venues_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.instruments
    ADD CONSTRAINT cucb_instruments_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.music
    ADD CONSTRAINT cucb_music_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.music_types
    ADD CONSTRAINT cucb_music_types_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.news
    ADD CONSTRAINT cucb_news_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.photos
    ADD CONSTRAINT cucb_photos_id_key PRIMARY KEY (photoid);
ALTER TABLE ONLY cucb.session_tunes
    ADD CONSTRAINT cucb_session_tunes_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.users
    ADD CONSTRAINT cucb_users_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.users_instruments
    ADD CONSTRAINT cucb_users_instruments_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.users_instruments_connections
    ADD CONSTRAINT cucb_users_instruments_connections_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.user_password_resets
    ADD CONSTRAINT cucb_user_password_resets_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.user_prefs
    ADD CONSTRAINT cucb_user_prefs_user_id_pref_id_key PRIMARY KEY (user_id, pref_id);
ALTER TABLE ONLY cucb.user_pref_types
    ADD CONSTRAINT cucb_user_pref_types_id_key PRIMARY KEY (id);
ALTER TABLE ONLY cucb.session
    ADD CONSTRAINT cucb_session_sid_key PRIMARY KEY (sid);
CREATE INDEX "IDX_session_expire" ON cucb.session USING btree (expire);
CREATE INDEX idx_17283_auth_bitmask ON cucb.auth_action_types USING btree (auth_bitmask);
CREATE INDEX idx_17295_user_id ON cucb.auth_tokens USING btree (user_id);
CREATE INDEX idx_17313_created_by ON cucb.biscuit_polls USING btree (created_by);
CREATE INDEX idx_17322_added_by ON cucb.biscuit_poll_entries USING btree (added_by);
CREATE INDEX idx_17322_poll ON cucb.biscuit_poll_entries USING btree (poll);
CREATE INDEX idx_17329_user ON cucb.biscuit_poll_votes USING btree ("user");
CREATE INDEX idx_17329_vote_for ON cucb.biscuit_poll_votes USING btree (vote_for);
CREATE INDEX idx_17334_user_id ON cucb.calendar_subscriptions USING btree (user_id);
CREATE INDEX idx_17360_committee ON cucb.committee_members USING btree (committee);
CREATE INDEX idx_17360_lookup_name ON cucb.committee_members USING btree (lookup_name);
CREATE INDEX idx_17360_position ON cucb.committee_members USING btree ("position");
CREATE INDEX idx_17383_user_id ON cucb.contacts USING btree (user_id);
CREATE INDEX idx_17399_posting_user ON cucb.gigs USING btree (posting_user);
CREATE INDEX idx_17399_type ON cucb.gigs USING btree (type);
CREATE INDEX idx_17399_venue_id ON cucb.gigs USING btree (venue_id);
CREATE INDEX idx_17412_contact_id ON cucb.gigs_contacts USING btree (contact_id);
CREATE UNIQUE INDEX idx_17423_gig_id ON cucb.gigs_lineups USING btree (gig_id, user_id);
CREATE INDEX idx_17423_user_id ON cucb.gigs_lineups USING btree (user_id);
CREATE INDEX idx_17435_gig_id ON cucb.gigs_lineups_instruments USING btree (gig_id, user_id);
CREATE INDEX idx_17435_user_instrument_id ON cucb.gigs_lineups_instruments USING btree (user_instrument_id, user_id);
CREATE UNIQUE INDEX idx_17440_code ON cucb.gig_types USING btree (code);
CREATE UNIQUE INDEX idx_17455_name ON cucb.instruments USING btree (name);
CREATE INDEX idx_17455_parent_id ON cucb.instruments USING btree (parent_id);
CREATE INDEX idx_17463_type ON cucb.music USING btree (type);
CREATE UNIQUE INDEX idx_17471_abc_field ON cucb.music_types USING btree (abc_field);
CREATE INDEX idx_17481_posted_by ON cucb.news USING btree (posted_by);
CREATE INDEX idx_17497_contributor ON cucb.session_tunes USING btree (contributor);
CREATE INDEX idx_17497_type ON cucb.session_tunes USING btree (type);
CREATE UNIQUE INDEX idx_17507_id ON cucb.songs USING btree (id);
CREATE UNIQUE INDEX idx_17515_email ON cucb.users USING btree (email);
CREATE UNIQUE INDEX idx_17515_username ON cucb.users USING btree (username);
CREATE INDEX idx_17525_id ON cucb.users_instruments USING btree (id, user_id);
CREATE INDEX idx_17525_instr_id ON cucb.users_instruments USING btree (instr_id);
CREATE INDEX idx_17525_user_id ON cucb.users_instruments USING btree (user_id);
CREATE INDEX idx_17532_conn_id ON cucb.users_instruments_connections USING btree (conn_id);
CREATE INDEX idx_17532_user_instrument_id ON cucb.users_instruments_connections USING btree (user_instrument_id);
CREATE INDEX idx_17538_user_id ON cucb.user_password_resets USING btree (user_id);
CREATE INDEX idx_17543_pref_id ON cucb.user_prefs USING btree (pref_id);
CREATE UNIQUE INDEX idx_17543_userpref ON cucb.user_prefs USING btree (user_id, pref_id);
CREATE UNIQUE INDEX idx_17551_name ON cucb.user_pref_types USING btree (name);
CREATE FUNCTION cucb.trigger_set_editing_time() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN NEW.editing_time = NOW(); RETURN NEW; END; $$;
CREATE TRIGGER set_editing_time BEFORE UPDATE ON cucb.gigs FOR EACH ROW EXECUTE PROCEDURE cucb.trigger_set_editing_time();
CREATE TRIGGER set_editing_time BEFORE UPDATE ON cucb.gigs_lineups FOR EACH ROW EXECUTE PROCEDURE cucb.trigger_set_editing_time();

ALTER TABLE ONLY cucb.auth_action_types
    ADD CONSTRAINT auth_action_types_ibfk_1 FOREIGN KEY (auth_bitmask) REFERENCES cucb.auth_bitmasks_permissions(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.auth_tokens
    ADD CONSTRAINT auth_tokens_ibfk_1 FOREIGN KEY (user_id) REFERENCES cucb.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY cucb.biscuit_poll_entries
    ADD CONSTRAINT biscuit_poll_entries_ibfk_1 FOREIGN KEY (poll) REFERENCES cucb.biscuit_polls(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.biscuit_poll_entries
    ADD CONSTRAINT biscuit_poll_entries_ibfk_2 FOREIGN KEY (added_by) REFERENCES cucb.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.biscuit_poll_votes
    ADD CONSTRAINT biscuit_poll_votes_ibfk_1 FOREIGN KEY (vote_for) REFERENCES cucb.biscuit_poll_entries(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.biscuit_poll_votes
    ADD CONSTRAINT biscuit_poll_votes_ibfk_2 FOREIGN KEY ("user") REFERENCES cucb.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.biscuit_polls
    ADD CONSTRAINT biscuit_polls_ibfk_1 FOREIGN KEY (created_by) REFERENCES cucb.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.calendar_subscriptions
    ADD CONSTRAINT calendar_subscriptions_ibfk_1 FOREIGN KEY (user_id) REFERENCES cucb.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY cucb.committee_members
    ADD CONSTRAINT committee_members_ibfk_1 FOREIGN KEY (lookup_name) REFERENCES cucb.committee_keys(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.committee_members
    ADD CONSTRAINT committee_members_ibfk_2 FOREIGN KEY (committee) REFERENCES cucb.committees(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.committee_members
    ADD CONSTRAINT committee_members_ibfk_3 FOREIGN KEY ("position") REFERENCES cucb.committee_positions(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.contacts
    ADD CONSTRAINT contacts_ibfk_1 FOREIGN KEY (user_id) REFERENCES cucb.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY cucb.gigs_contacts
    ADD CONSTRAINT gigs_contacts_ibfk_1 FOREIGN KEY (gig_id) REFERENCES cucb.gigs(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY cucb.gigs_contacts
    ADD CONSTRAINT gigs_contacts_ibfk_2 FOREIGN KEY (contact_id) REFERENCES cucb.contacts(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.gigs
    ADD CONSTRAINT gigs_ibfk_1 FOREIGN KEY (type) REFERENCES cucb.gig_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.gigs
    ADD CONSTRAINT gigs_ibfk_2 FOREIGN KEY (venue_id) REFERENCES cucb.gig_venues(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.gigs
    ADD CONSTRAINT gigs_ibfk_3 FOREIGN KEY (posting_user) REFERENCES cucb.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY cucb.gigs_lineups
    ADD CONSTRAINT gigs_lineups_ibfk_1 FOREIGN KEY (gig_id) REFERENCES cucb.gigs(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY cucb.gigs_lineups
    ADD CONSTRAINT gigs_lineups_ibfk_2 FOREIGN KEY (user_id) REFERENCES cucb.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY cucb.gigs_lineups_instruments
    ADD CONSTRAINT gigs_lineups_instruments_ibfk_1 FOREIGN KEY (gig_id, user_id) REFERENCES cucb.gigs_lineups(gig_id, user_id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY cucb.gigs_lineups_instruments
    ADD CONSTRAINT gigs_lineups_instruments_user_instrument_id_fkey FOREIGN KEY (user_instrument_id) REFERENCES cucb.users_instruments(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.instruments
    ADD CONSTRAINT instruments_ibfk_1 FOREIGN KEY (parent_id) REFERENCES cucb.instruments(id) ON UPDATE SET NULL ON DELETE SET NULL;
ALTER TABLE ONLY cucb.music
    ADD CONSTRAINT music_ibfk_1 FOREIGN KEY (type) REFERENCES cucb.music_types(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.news
    ADD CONSTRAINT news_ibfk_1 FOREIGN KEY (posted_by) REFERENCES cucb.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.session_tunes
    ADD CONSTRAINT session_tunes_ibfk_1 FOREIGN KEY (type) REFERENCES cucb.music_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.session_tunes
    ADD CONSTRAINT session_tunes_ibfk_2 FOREIGN KEY (contributor) REFERENCES cucb.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.user_password_resets
    ADD CONSTRAINT user_password_resets_ibfk_1 FOREIGN KEY (user_id) REFERENCES cucb.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.user_prefs
    ADD CONSTRAINT user_prefs_ibfk_2 FOREIGN KEY (pref_id) REFERENCES cucb.user_pref_types(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.user_prefs
    ADD CONSTRAINT user_prefs_ibfk_3 FOREIGN KEY (user_id) REFERENCES cucb.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.users_instruments_connections
    ADD CONSTRAINT users_instruments_connections_ibfk_1 FOREIGN KEY (user_instrument_id) REFERENCES cucb.users_instruments(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY cucb.users_instruments_connections
    ADD CONSTRAINT users_instruments_connections_ibfk_2 FOREIGN KEY (conn_id) REFERENCES cucb.connection_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY cucb.users_instruments
    ADD CONSTRAINT users_instruments_ibfk_1 FOREIGN KEY (user_id) REFERENCES cucb.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY cucb.users_instruments
    ADD CONSTRAINT users_instruments_ibfk_2 FOREIGN KEY (instr_id) REFERENCES cucb.instruments(id) ON UPDATE CASCADE ON DELETE RESTRICT;

