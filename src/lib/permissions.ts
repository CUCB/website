import { Literal, Null, Record, String, Undefined, Union } from "runtypes";
import type { Runtype } from "runtypes";

const ROLES = {
  webmaster: Literal("webmaster"),
  president: Literal("president"),
  secretary: Literal("secretary"),
  treasurer: Literal("treasurer"),
  equipment: Literal("equipment"),
  gigEditor: Literal("gig_editor"),
  user: Literal("user"),
  musicOnly: Literal("music_only"),
  blueGig: Literal("blue_gig"),
};

const LOGGED_IN = Record({ userId: String });

const HAS_ROLE = (role: Runtype) =>
  LOGGED_IN.And(
    Record({ alternativeRole: role }).Or(Record({ alternativeRole: Null.Or(Undefined), hasuraRole: role })),
  );
export const NOT_MUSIC_ONLY = LOGGED_IN.withConstraint((session) => !HAS_ROLE(ROLES.musicOnly).guard(session));

export const IS_SELF = (userId: string) => Record({ userId: Literal(userId) });
export const UPDATE_BIO = (userId: string) =>
  HAS_ROLE(
    Union(ROLES.webmaster, ROLES.president, ROLES.secretary, ROLES.treasurer, ROLES.equipment, ROLES.gigEditor),
  ).Or(IS_SELF(userId));
export const UPDATE_INSTRUMENTS = (userId: string) =>
  HAS_ROLE(Union(ROLES.webmaster, ROLES.president, ROLES.secretary)).Or(IS_SELF(userId));
export const UPDATE_ADMIN_STATUS = (userId: string) =>
  HAS_ROLE(ROLES.webmaster).withConstraint((session: { userId: string }) => session.userId != userId);
export const UPDATE_GIG_DETAILS = HAS_ROLE(
  Union(ROLES.webmaster, ROLES.president, ROLES.secretary, ROLES.treasurer, ROLES.equipment, ROLES.gigEditor),
);
export const SELECT_LINEUPS = HAS_ROLE(ROLES.webmaster.Or(ROLES.president));
// TODO check this is correct, I'm mostly just guessing
export const VIEW_SIGNUP_SUMMARY = HAS_ROLE(Union(ROLES.webmaster, ROLES.president, ROLES.secretary));
export const VIEW_GIG_CONTACT_DETAILS = UPDATE_GIG_DETAILS.Or(HAS_ROLE(ROLES.blueGig));
export const VIEW_GIG_ADMIN_NOTES = UPDATE_GIG_DETAILS;
export const VIEW_HIDDEN_GIGS = UPDATE_GIG_DETAILS.Or(HAS_ROLE(ROLES.blueGig));
// TODO we also have SELECT_LINEUPS
export const SELECT_GIG_LINEUPS = HAS_ROLE(Union(ROLES.webmaster, ROLES.president));
export const DELETE_GIG = HAS_ROLE(Union(ROLES.webmaster, ROLES.president, ROLES.secretary));
