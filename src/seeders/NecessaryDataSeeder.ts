import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { AuthActionType } from "../lib/entities/AuthActionType";
import { AuthBitmasksPermission } from "../lib/entities/AuthBitmasksPermission";
import { AuthUserType } from "../lib/entities/AuthUserType";
import { CalendarSubscriptionType } from "../lib/entities/CalendarSubscriptionType";
import { CommitteeKey } from "../lib/entities/CommitteeKey";
import { CommitteePosition } from "../lib/entities/CommitteePosition";
import { ConnectionType } from "../lib/entities/ConnectionType";
import { GigType } from "../lib/entities/GigType";
import { Instrument } from "../lib/entities/Instrument";
import { MusicType } from "../lib/entities/MusicType";
import { UserPrefType } from "../lib/entities/UserPrefType";

export class NecessaryDataSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    em.upsert(AuthBitmasksPermission, { id: "1", phpTitle: "AUTH_VIEW_HIDDEN_GIGS", bitmask: "127" });
    em.upsert(AuthBitmasksPermission, { id: "2", phpTitle: "AUTH_VIEW_LINEUP_APPLICATIONS", bitmask: "7" });
    em.upsert(AuthBitmasksPermission, { id: "3", phpTitle: "AUTH_EDIT_GIGS", bitmask: "95" });
    em.upsert(AuthBitmasksPermission, { id: "4", phpTitle: "AUTH_MANAGE_OTHER_USERS", bitmask: "95" });
    em.upsert(AuthBitmasksPermission, { id: "5", phpTitle: "AUTH_VIEW_ADMIN_NOTES", bitmask: "95" });
    em.upsert(AuthBitmasksPermission, { id: "6", phpTitle: "AUTH_VIEW_CONTACTS", bitmask: "127" });
    em.upsert(AuthBitmasksPermission, { id: "7", phpTitle: "AUTH_VIEW_FINANCE", bitmask: "95" });
    em.upsert(AuthBitmasksPermission, { id: "8", phpTitle: "AUTH_EMAIL_LINEUP", bitmask: "127" });
    em.upsert(AuthBitmasksPermission, { id: "9", phpTitle: "AUTH_EDIT_LINEUP", bitmask: "3" });
    em.upsert(AuthBitmasksPermission, { id: "10", phpTitle: "AUTH_EMAIL_LISTS", bitmask: "95" });
    em.upsert(AuthBitmasksPermission, { id: "11", phpTitle: "AUTH_MODERATE_FORUM", bitmask: "95" });
    em.upsert(AuthBitmasksPermission, { id: "12", phpTitle: "AUTH_CHANGE_ADMIN_STATE", bitmask: "1" });
    em.upsert(AuthBitmasksPermission, { id: "13", phpTitle: "AUTH_ADMINISTRATE_WEBSITE", bitmask: "1" });
    em.upsert(AuthBitmasksPermission, { id: "14", phpTitle: "AUTH_NORMAL_RIGHTS", bitmask: "1407" });
    em.upsert(AuthBitmasksPermission, { id: "15", phpTitle: "AUTH_VIEW_MUSIC", bitmask: "1535" });
    em.upsert(AuthBitmasksPermission, { id: "16", phpTitle: "AUTH_AS_NORMAL_USER", bitmask: "1151" });
    em.upsert(AuthBitmasksPermission, { id: "17", phpTitle: "AUTH_EDIT_SESSION_TUNES", bitmask: "95" });
    em.upsert(AuthBitmasksPermission, { id: "18", phpTitle: "AUTH_VIEW_GIGS_NEEDING_ATTENTION", bitmask: "7" });
    em.upsert(AuthBitmasksPermission, { id: "19", phpTitle: "AUTH_MANAGE_USER_INSTRUMENT_INFO", bitmask: "23" });
    em.upsert(AuthBitmasksPermission, { id: "20", phpTitle: "AUTH_ANYBODY", bitmask: "2047" });
    em.upsert(AuthBitmasksPermission, { id: "21", phpTitle: "AUTH_NOT_LOGGED_IN", bitmask: "512" });
    em.upsert(AuthBitmasksPermission, { id: "22", phpTitle: "AUTH_MUSIC_ONLY", bitmask: "128" });
    em.upsert(AuthBitmasksPermission, { id: "23", phpTitle: "AUTH_CREATE_BISCUIT_POLL", bitmask: "1025" });

    em.upsert(AuthActionType, { id: "1", description: "Whether 'blue gigs' can be viewed.", authBitmask: "1" });
    em.upsert(AuthActionType, {
      id: "2",
      description:
        "Whether the state, notes and instruments of lineup applications can be viewed - includes ability to view and edit admin notes on lineup applications!",
      authBitmask: "2",
    });
    em.upsert(AuthActionType, {
      id: "3",
      description:
        "Grants all rights to edit gigs, but none regarding choosing lineups or viewing lineup applications.",
      authBitmask: "3",
    });
    em.upsert(AuthActionType, {
      id: "4",
      description: "Whether can edit other users' settings (and see this display!).",
      authBitmask: "4",
    });
    em.upsert(AuthActionType, {
      id: "5",
      description:
        'Whether various admin notes can be viewed", description: including notes on gigs and venues. (Does not apply to lineup applications!)',
      authBitmask: "5",
    });
    em.upsert(AuthActionType, {
      id: "6",
      description: "Whether allowed to see contact names on gigs.",
      authBitmask: "6",
    });
    em.upsert(AuthActionType, {
      id: "7",
      description: "Whether the user can see the financial details of gigs.",
      authBitmask: "7",
    });
    em.upsert(AuthActionType, {
      id: "8",
      description:
        "Whether the e-mail addresses of lineups are available and can use website to send messages to them.",
      authBitmask: "8",
    });
    em.upsert(AuthActionType, { id: "9", description: "Whether can select/edit lineups.", authBitmask: "9" });
    em.upsert(AuthActionType, {
      id: "10",
      description: "Whether given ability to directly e-mail mailing lists from the website.",
      authBitmask: "10",
    });
    em.upsert(AuthActionType, {
      id: "11",
      description: 'Whether can moderate the messageboard", deleting messages etc.',
      authBitmask: "11",
    });
    em.upsert(AuthActionType, {
      id: "12",
      description: "Whether can change the privileges of other users.",
      authBitmask: "12",
    });
    em.upsert(AuthActionType, {
      id: "13",
      description: "Catch-all for things only a webmaster should be allowed to do.",
      authBitmask: "13",
    });
    em.upsert(AuthActionType, {
      id: "14",
      description:
        "Gives normal user abilities: being able to view members' pages, being eligible for signups\", description: etc. - cf. Music Only.",
      authBitmask: "14",
    });
    em.upsert(AuthActionType, {
      id: "15",
      description: "Whether allowed to see our fantastic music collection.",
      authBitmask: "15",
    });
    em.upsert(AuthActionType, {
      id: "16",
      description: 'Whether to allow users to view things "as normal users".',
      authBitmask: "16",
    });
    em.upsert(AuthActionType, {
      id: "17",
      description: "Whether allowed to edit session tunes uploaded by other people.",
      authBitmask: "17",
    });
    em.upsert(AuthActionType, {
      id: "18",
      description: "Whether gig diary presents gigs enquiries needing chasing/callers booking.",
      authBitmask: "18",
    });
    em.upsert(AuthActionType, {
      id: "19",
      description:
        "Whether user can view and edit users' instrument info, in particular connection types. (Should be granted if can manage other users.)",
      authBitmask: "19",
    });
    em.upsert(AuthActionType, { id: "20", description: "Whether biscuit polls can be created", authBitmask: "23" });

    em.upsert(AuthUserType, {
      id: "1",
      title: "Administrator",
      phpTitle: "ADMIN_STATUS_FULL",
      hasuraRole: "webmaster",
    });
    em.upsert(AuthUserType, {
      id: "2",
      title: "President",
      phpTitle: "ADMIN_STATUS_PRESIDENT",
      hasuraRole: "president",
    });
    em.upsert(AuthUserType, {
      id: "3",
      title: "Secretary",
      phpTitle: "ADMIN_STATUS_SECRETARY",
      hasuraRole: "secretary",
    });
    em.upsert(AuthUserType, {
      id: "4",
      title: "Treasurer",
      phpTitle: "ADMIN_STATUS_TREASURER",
      hasuraRole: "treasurer",
    });
    em.upsert(AuthUserType, {
      id: "5",
      title: "Equipment Officer",
      phpTitle: "ADMIN_STATUS_EQUIPMENT",
      hasuraRole: "equipment",
    });
    em.upsert(AuthUserType, {
      id: "6",
      title: "Blue Gig Authorized",
      phpTitle: "ADMIN_STATUS_HIDDEN_AUTH",
      hasuraRole: "blue_gig",
    });
    em.upsert(AuthUserType, {
      id: "7",
      title: "Gig Editor",
      phpTitle: "ADMIN_STATUS_GIG_EDITOR",
      hasuraRole: "gig_editor",
    });
    em.upsert(AuthUserType, {
      id: "8",
      title: "Music Only",
      phpTitle: "ADMIN_STATUS_MUSIC_ONLY",
      hasuraRole: "music_only",
    });
    em.upsert(AuthUserType, { id: "9", title: "Normal User", phpTitle: "ADMIN_STATUS_NONE", hasuraRole: "user" });
    em.upsert(AuthUserType, {
      id: "11",
      title: "General Member",
      phpTitle: "ADMIN_STATUS_GENERAL_MEMBER",
      hasuraRole: "general_member",
    });
    em.upsert(AuthUserType, {
      id: "10",
      title: "Non Member",
      phpTitle: "ADMIN_STATUS_NO_AUTH",
      hasuraRole: "anonymous",
    });

    em.upsert(CommitteeKey, { id: "1", name: "president" });
    em.upsert(CommitteeKey, { id: "2", name: "secretary" });
    em.upsert(CommitteeKey, { id: "3", name: "treasurer" });
    em.upsert(CommitteeKey, { id: "4", name: "social" });
    em.upsert(CommitteeKey, { id: "5", name: "logistics" });
    em.upsert(CommitteeKey, { id: "6", name: "equipment" });
    em.upsert(CommitteeKey, { id: "7", name: "tour" });
    em.upsert(CommitteeKey, { id: "8", name: "webmaster" });
    em.upsert(CommitteeKey, { id: "10", name: "webmaster1" });
    em.upsert(CommitteeKey, { id: "11", name: "webmaster2" });
    em.upsert(CommitteeKey, { id: "12", name: "genmember1" });
    em.upsert(CommitteeKey, { id: "13", name: "genmember2" });
    em.upsert(CommitteeKey, { id: "14", name: "genmember3" });
    em.upsert(CommitteeKey, { id: "15", name: "genmember4" });

    em.upsert(CommitteePosition, { id: "1", name: "President", position: "5" });
    em.upsert(CommitteePosition, { id: "2", name: "Secretary", position: "10" });
    em.upsert(CommitteePosition, { id: "3", name: "Treasurer", position: "15" });
    em.upsert(CommitteePosition, { id: "4", name: "Social Secretary", position: "20" });
    em.upsert(CommitteePosition, { id: "5", name: "Equipment Officer", position: "30" });
    em.upsert(CommitteePosition, { id: "6", name: "Logistics Officer", position: "25" });
    em.upsert(CommitteePosition, { id: "7", name: "Tour Secretary", position: "35" });
    em.upsert(CommitteePosition, { id: "8", name: "Webmaster", position: "40" });
    em.upsert(CommitteePosition, { id: "9", name: "General Member", position: "45" });
    em.upsert(CommitteePosition, { id: "10", name: "Equipment Helper", position: "50" });
    em.upsert(CommitteePosition, { id: "11", name: "Musical Director", position: "55" });
    em.upsert(CommitteePosition, { id: "12", name: "Presidential Administrator", position: "7" });
    em.upsert(CommitteePosition, { id: "13", name: "Tour Organiser", position: "35" });
    em.upsert(CommitteePosition, { id: "14", name: "Generally Helpful Person", position: "45" });

    em.upsert(ConnectionType, { id: "1", name: "Unknown", iconName: "question-mark" });
    em.upsert(ConnectionType, { id: "2", name: "Microphone + XLR", iconName: "mic" });
    em.upsert(ConnectionType, { id: "3", name: "Pickup + Jack", iconName: "pickup-jack" });
    em.upsert(ConnectionType, { id: "4", name: "Pickup + XLR", iconName: "pickup-xlr" });
    em.upsert(ConnectionType, { id: "5", name: "Jack (Band)", iconName: "jack" });
    em.upsert(ConnectionType, { id: "6", name: "Jack (Own)", iconName: "jack-own" });
    em.upsert(ConnectionType, { id: "7", name: "Radio Mic (XLR)", iconName: "xlr" });
    em.upsert(ConnectionType, { id: "8", name: "XLR (Band)", iconName: "xlr" });
    em.upsert(ConnectionType, { id: "9", name: "XLR (Own)", iconName: "xlr-own" });

    em.upsert(GigType, { id: "1", code: "gig", title: "Gig" });
    em.upsert(GigType, { id: "2", code: "gig_enquiry", title: "Gig Enquiry" });
    em.upsert(GigType, { id: "3", code: "gig_cancelled", title: "Cancelled Gig" });
    em.upsert(GigType, { id: "6", code: "kit", title: "Kit Borrowing" });
    em.upsert(GigType, { id: "7", code: "calendar", title: "Calendar Dates" });
    em.upsert(GigType, { id: "8", code: "draft", title: "[DRAFT]" });

    em.upsert(Instrument, { id: "1", name: "Fiddle", novelty: false, parent_only: false });
    em.upsert(Instrument, { id: "91", name: "Other Brass", novelty: false, parent_only: true });
    em.upsert(Instrument, { id: "92", name: "Other Wind", novelty: false, parent_only: true });
    em.upsert(Instrument, { id: "93", name: "Other Strings", novelty: false, parent_only: true });
    em.upsert(Instrument, { id: "96", name: "Guitar Family", novelty: false, parent_only: true });
    em.upsert(Instrument, { id: "99", name: "Squeezebox", novelty: false, parent_only: true });
    em.upsert(Instrument, { id: "12", name: "Harp", novelty: false, parent_only: false });
    em.upsert(Instrument, { id: "16", name: "Recorder(s)", novelty: false, parent_only: false });
    em.upsert(Instrument, { id: "27", name: "Percussion", novelty: false, parent_only: false });
    em.upsert(Instrument, { id: "45", name: "Keyboards", novelty: false, parent_only: false });
    em.upsert(Instrument, { id: "38", name: "Whistle(s)", novelty: false, parent_only: false });
    em.upsert(Instrument, { id: "58", name: "Bagpipes", novelty: false, parent_only: false });
    em.upsert(Instrument, { id: "62", name: "Voice", novelty: false, parent_only: false });
    em.upsert(Instrument, { id: "63", name: "Eigenharp", novelty: false, parent_only: false });
    em.upsert(Instrument, { id: "65", name: "Novelty", novelty: true, parent_only: true });
    em.upsert(Instrument, {
      id: "2",
      name: "Anglo Hardingfele",
      novelty: false,
      parent_only: false,
      parent: "1",
    });
    em.upsert(Instrument, {
      id: "3",
      name: "Viola",
      novelty: false,
      parent_only: false,
      parent: "93",
    });
    em.upsert(Instrument, {
      id: "4",
      name: "Banjo",
      novelty: false,
      parent_only: false,
      parent: "96",
    });
    em.upsert(Instrument, {
      id: "5",
      name: "Tenor Banjo",
      novelty: false,
      parent_only: false,
      parent: "96",
    });
    em.upsert(Instrument, {
      id: "6",
      name: "Bouzouki",
      novelty: false,
      parent_only: false,
      parent: "96",
    });
    em.upsert(Instrument, {
      id: "7",
      name: "Mandolin",
      novelty: false,
      parent_only: false,
      parent: "96",
    });
    em.upsert(Instrument, {
      id: "8",
      name: "Ukulele",
      novelty: false,
      parent_only: false,
      parent: "96",
    });
    em.upsert(Instrument, {
      id: "9",
      name: "Tenor Guitar",
      novelty: false,
      parent_only: false,
      parent: "96",
    });
    em.upsert(Instrument, {
      id: "10",
      name: "Timple",
      novelty: false,
      parent_only: false,
      parent: "96",
    });
    em.upsert(Instrument, {
      id: "11",
      name: "Charango",
      novelty: false,
      parent_only: false,
      parent: "96",
    });
    em.upsert(Instrument, {
      id: "13",
      name: "Lever Harp",
      novelty: false,
      parent_only: false,
      parent: "12",
    });
    em.upsert(Instrument, {
      id: "14",
      name: "Flute",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "15",
      name: "Baroque Flute",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "17",
      name: "Descant Recorder",
      novelty: false,
      parent_only: false,
      parent: "16",
    });
    em.upsert(Instrument, {
      id: "18",
      name: "Tenor Recorder",
      novelty: false,
      parent_only: false,
      parent: "16",
    });
    em.upsert(Instrument, {
      id: "19",
      name: "Bass Recorder",
      novelty: false,
      parent_only: false,
      parent: "16",
    });
    em.upsert(Instrument, {
      id: "20",
      name: "Wind Synth",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "21",
      name: "Mouth Organ",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "22",
      name: "Bodhran",
      novelty: false,
      parent_only: false,
      parent: "27",
    });
    em.upsert(Instrument, {
      id: "23",
      name: "Drum(s)",
      novelty: false,
      parent_only: false,
      parent: "27",
    });
    em.upsert(Instrument, {
      id: "24",
      name: "Hand-Drum",
      novelty: false,
      parent_only: false,
      parent: "27",
    });
    em.upsert(Instrument, {
      id: "25",
      name: "Table Drum",
      novelty: false,
      parent_only: false,
      parent: "27",
    });
    em.upsert(Instrument, {
      id: "26",
      name: "Cajón",
      novelty: false,
      parent_only: false,
      parent: "27",
    });
    em.upsert(Instrument, {
      id: "28",
      name: "Djembe",
      novelty: false,
      parent_only: false,
      parent: "27",
    });
    em.upsert(Instrument, {
      id: "29",
      name: "Clarinet",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "30",
      name: "Accordion",
      novelty: false,
      parent_only: false,
      parent: "99",
    });
    em.upsert(Instrument, {
      id: "31",
      name: "Melodeon",
      novelty: false,
      parent_only: false,
      parent: "99",
    });
    em.upsert(Instrument, {
      id: "32",
      name: "Concertina",
      novelty: false,
      parent_only: false,
      parent: "99",
    });
    em.upsert(Instrument, {
      id: "33",
      name: "English Concertina",
      novelty: false,
      parent_only: false,
      parent: "99",
    });
    em.upsert(Instrument, {
      id: "34",
      name: "Piano Accordion",
      novelty: false,
      parent_only: false,
      parent: "99",
    });
    em.upsert(Instrument, {
      id: "35",
      name: "British Chromatic Accordion",
      novelty: false,
      parent_only: false,
      parent: "99",
    });
    em.upsert(Instrument, {
      id: "36",
      name: "Guitar",
      novelty: false,
      parent_only: false,
      parent: "96",
    });
    em.upsert(Instrument, {
      id: "37",
      name: "Bass Guitar",
      novelty: false,
      parent_only: false,
      parent: "96",
    });
    em.upsert(Instrument, {
      id: "39",
      name: "Low Whistle(s)",
      novelty: false,
      parent_only: false,
      parent: "38",
    });
    em.upsert(Instrument, {
      id: "40",
      name: "High Whistle(s)",
      novelty: false,
      parent_only: false,
      parent: "38",
    });
    em.upsert(Instrument, {
      id: "41",
      name: "Cello",
      novelty: false,
      parent_only: false,
      parent: "93",
    });
    em.upsert(Instrument, {
      id: "42",
      name: "Electric Cello",
      novelty: false,
      parent_only: false,
      parent: "93",
    });
    em.upsert(Instrument, {
      id: "43",
      name: "Double Bass",
      novelty: false,
      parent_only: false,
      parent: "93",
    });
    em.upsert(Instrument, {
      id: "44",
      name: "Piano",
      novelty: false,
      parent_only: false,
      parent: "45",
    });
    em.upsert(Instrument, {
      id: "46",
      name: "Piccolo",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "47",
      name: "Oboe",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "48",
      name: "Bassoon",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "49",
      name: "Xaphoon",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "50",
      name: "Bombarde",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "51",
      name: "Trumpet",
      novelty: false,
      parent_only: false,
      parent: "91",
    });
    em.upsert(Instrument, {
      id: "52",
      name: "Cornet",
      novelty: false,
      parent_only: false,
      parent: "91",
    });
    em.upsert(Instrument, {
      id: "53",
      name: "Trombone",
      novelty: false,
      parent_only: false,
      parent: "91",
    });
    em.upsert(Instrument, {
      id: "54",
      name: "Tuba",
      novelty: false,
      parent_only: false,
      parent: "91",
    });
    em.upsert(Instrument, {
      id: "55",
      name: "Tenor Saxophone",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "56",
      name: "Alto Saxophone",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "57",
      name: "Baritone Saxophone",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "59",
      name: "Smallpipes",
      novelty: false,
      parent_only: false,
      parent: "58",
    });
    em.upsert(Instrument, {
      id: "60",
      name: "Scottish Smallpipes (A)",
      novelty: false,
      parent_only: false,
      parent: "58",
    });
    em.upsert(Instrument, {
      id: "61",
      name: "Great Highland Bagpipes",
      novelty: false,
      parent_only: false,
      parent: "58",
    });
    em.upsert(Instrument, {
      id: "64",
      name: "Kazoo",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "66",
      name: "Saxoflute",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "67",
      name: "Wine Bottle",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "68",
      name: "Hosepipe",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "69",
      name: "Turnip",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "70",
      name: "HTML Editor",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "71",
      name: "Not the wine bottle",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "72",
      name: "Most non fiddle instruments",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "73",
      name: "Joy",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "74",
      name: "It's a little tricky on the cello...",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "75",
      name: "Pie Charts",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "76",
      name: "Egg Shaker",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "77",
      name: "Evilness",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "78",
      name: "More Loved",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "79",
      name: "Hat",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "80",
      name: "Stompin'",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "81",
      name: "Mild Peril",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "82",
      name: "Almost anything",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "83",
      name: "But really badly",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "84",
      name: "Something Portable",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "85",
      name: "An Instrument Belonging To Someone Else",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "86",
      name: "Instrument swapping",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "87",
      name: "Secretary's paperknife",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "88",
      name: "Chequebook",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "89",
      name: "Dancing!",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "100",
      name: "Soprano Saxophone",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "101",
      name: "Autoharp",
      novelty: false,
      parent_only: false,
      parent: "12",
    });
    em.upsert(Instrument, {
      id: "102",
      name: "Cuatro",
      novelty: false,
      parent_only: false,
      parent: "96",
    });
    em.upsert(Instrument, {
      id: "103",
      name: "Hurdy Gurdy",
      novelty: false,
      parent_only: false,
      parent: "1",
    });
    em.upsert(Instrument, {
      id: "104",
      name: "Cor Anglais",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "105",
      name: "Pan Flute",
      novelty: false,
      parent_only: false,
      parent: "92",
    });
    em.upsert(Instrument, {
      id: "106",
      name: "eMelodeon",
      novelty: false,
      parent_only: false,
      parent: "99",
    });
    em.upsert(Instrument, {
      id: "108",
      name: "Blade of grass",
      novelty: true,
      parent_only: false,
      parent: "65",
    });
    em.upsert(Instrument, {
      id: "109",
      name: "Stomp Box",
      novelty: true,
      parent_only: false,
      parent: "27",
    });
    em.upsert(Instrument, {
      id: "110",
      name: "Shawm",
      novelty: true,
      parent_only: false,
      parent: "92",
    });

    em.upsert(MusicType, {
      id: "1",
      abcField: "jig",
      name: "Jig (32 bar)",
      description: "32 bar, 6/8 tunes, the staple of folk dance",
      commonType: true,
    });
    em.upsert(MusicType, {
      id: "2",
      abcField: "reel",
      name: "Reel (32 bar)",
      description: "32 bar, 4/4 tunes, and the standard tune type for walking-style dances",
      commonType: true,
    });
    em.upsert(MusicType, {
      id: "4",
      abcField: "polka",
      name: "Polka",
      description: "Bouncy 2/4 tunes with strong upbeats",
      commonType: true,
    });
    em.upsert(MusicType, {
      id: "5",
      abcField: "march",
      name: "March",
      description: "Fast walking-pace dance music, usually 2/4 or 4/4",
      commonType: false,
    });
    em.upsert(MusicType, {
      id: "6",
      abcField: "hornpipe",
      name: "Hornpipe",
      description: "Music for hop-step dances, often played 'swung'",
      commonType: true,
    });
    em.upsert(MusicType, {
      id: "7",
      abcField: "slip jig",
      name: "Slip Jig",
      description: "Tunes in 9/8 typically used for flowing 'unphrased' dances",
      commonType: true,
    });
    em.upsert(MusicType, {
      id: "8",
      abcField: "jig 48",
      name: "Jig (48 bar)",
      description: "Similar to normal jigs, but with dances half as long again",
      commonType: false,
    });
    em.upsert(MusicType, {
      id: "9",
      abcField: "reel 48",
      name: "Reel (48 bar)",
      description: "Similar to normal reels, but with dances half as long again",
      commonType: false,
    });
    em.upsert(MusicType, {
      id: "10",
      abcField: "schottische",
      name: "Schottische",
      description: "Angular 2/4 and 4/4 tunes, similar to polkas",
      commonType: false,
    });
    em.upsert(MusicType, {
      id: "11",
      abcField: "slow reel",
      name: "Slow Reel",
      description: "Reels intended to be played notably slower than would be normal for dance for musical effect",
      commonType: false,
    });
    em.upsert(MusicType, {
      id: "12",
      abcField: "air",
      name: "Air",
      description: "A free tune, written for listening rather than dance, commonly in 3/4",
      commonType: false,
    });
    em.upsert(MusicType, {
      id: "13",
      abcField: "strathspey and reel",
      name: "Strathspey & Reel",
      description:
        "Used for dances which flow directly from a  strathspey (a special dance style) into a reel, but commonly played for musical effect",
      commonType: false,
    });
    em.upsert(MusicType, {
      id: "14",
      abcField: "jig 5/8",
      name: "5/8 Jig",
      description: "Jig-like tune with 5 beats to the bar, not generally for dancing",
      commonType: false,
    });
    em.upsert(MusicType, {
      id: "15",
      abcField: "jig 7/8",
      name: "7/8 Jig",
      description: "Jig-like tune with 7 beats to the bar, not generally for dancing",
      commonType: false,
    });
    em.upsert(MusicType, {
      id: "16",
      abcField: "mixed",
      name: "Mixed",
      description: "Non-standard combinations of multiple tune types",
      commonType: false,
    });
    em.upsert(MusicType, {
      id: "3",
      abcField: "waltz",
      name: "Waltz",
      description: "The familiar 3/4 dance style",
      commonType: true,
    });

    em.upsert(UserPrefType, { id: "1", name: "style.fullscreen", default: false });
    em.upsert(UserPrefType, { id: "2", name: "style.gigs.twocol", default: false });
    em.upsert(UserPrefType, { id: "3", name: "attribute.driver", default: false });
    em.upsert(UserPrefType, { id: "4", name: "attribute.car", default: false });
    em.upsert(UserPrefType, { id: "5", name: "attribute.soundtech", default: false });
    em.upsert(UserPrefType, { id: "6", name: "attribute.leader", default: false });
    em.upsert(UserPrefType, { id: "7", name: "attribute.tshirt", default: false });
    em.upsert(UserPrefType, { id: "8", name: "attribute.folder", default: false });
    em.upsert(UserPrefType, { id: "9", name: "music.sortbytype", default: false });
    em.upsert(UserPrefType, { id: "10", name: "style.gigs.shownicknames", default: false });
    em.upsert(UserPrefType, { id: "11", name: "style.gigs.showconnections", default: false });
    em.upsert(UserPrefType, { id: "12", name: "style.calendar.termly", default: true });

    em.upsert(CalendarSubscriptionType, { name: "allgigs" });
    em.upsert(CalendarSubscriptionType, { name: "mygigs" });

    await em.flush();
  }
}