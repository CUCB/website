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
    Record({ alternativeRole: role })
      .Or(Record({ alternativeRole: Null.Or(Undefined), hasuraRole: role }))
      .Or(Record({ hasuraRole: role }).withConstraint((record) => !record.hasOwnProperty("alternativeRole"))),
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
// TODO check this is correct, I'm mostly just guessing
export const VIEW_SIGNUP_SUMMARY = HAS_ROLE(Union(ROLES.webmaster, ROLES.president, ROLES.secretary));
export const VIEW_GIG_CONTACT_DETAILS = UPDATE_GIG_DETAILS.Or(HAS_ROLE(ROLES.blueGig));
export const VIEW_GIG_ADMIN_NOTES = UPDATE_GIG_DETAILS;
export const VIEW_HIDDEN_GIGS = UPDATE_GIG_DETAILS.Or(HAS_ROLE(ROLES.blueGig));
export const SELECT_GIG_LINEUPS = HAS_ROLE(Union(ROLES.webmaster, ROLES.president));
export const DELETE_GIG = HAS_ROLE(Union(ROLES.webmaster, ROLES.president, ROLES.secretary));

if (import.meta.vitest) {
  const { it, describe, expect } = import.meta.vitest;
  const userWithRole = (role: string) => ({ hasuraRole: role, alternativeRole: null, userId: "1" });

  describe("NOT_MUSIC_ONLY", () => {
    const sut = NOT_MUSIC_ONLY;

    it("rejects users that aren't logged in", () => {
      expect(sut.guard({})).to.be.false;
    });

    it("rejects users with music only permissions", () => {
      expect(sut.guard(userWithRole("music_only"))).to.be.false;
    });

    it("rejects users with the alternative role music only", () => {
      expect(sut.guard({ ...userWithRole("webmaster"), alternativeRole: "music_only" })).to.be.false;
    });

    it("accepts users with roles other than music only", () => {
      expect(sut.guard(userWithRole("user"))).to.be.true;
      expect(sut.guard(userWithRole("president"))).to.be.true;
    });
  });

  describe("HAS_ROLE", () => {
    const sut = HAS_ROLE;

    it("accepts a user with just the specified role", () => {
      expect(sut(ROLES.user).guard({ userId: "1", hasuraRole: "user" })).to.be.true;
    });

    it("accepts a user with just the specified role and null alternative role", () => {
      expect(sut(ROLES.user).guard({ userId: "1", hasuraRole: "user", alternativeRole: null })).to.be.true;
      expect(sut(ROLES.user).guard({ userId: "1", hasuraRole: "user", alternativeRole: undefined })).to.be.true;
    });

    it("accepts a user with the correct alternative role", () => {
      expect(sut(ROLES.user).guard({ userId: "1", hasuraRole: "webmaster", alternativeRole: "user" })).to.be.true;
    });

    it("rejects a user with an incorrect role", () => {
      expect(sut(ROLES.president).guard({ userId: "1", hasuraRole: "blue_gig" })).to.be.false;
    });

    it("rejects a user with the correct role but incorrect alternative role", () => {
      expect(sut(ROLES.webmaster).guard({ userId: "1", hasuraRole: "webmaster", alternativeRole: "user" })).to.be.false;
    });

    it("rejects a person who is not logged in", () => {
      expect(sut(ROLES.user).guard({})).to.be.false;
    });
  });

  describe("SELECT_GIG_LINEUPS", () => {
    const sut = SELECT_GIG_LINEUPS;

    it("accepts a webmaster", () => {
      expect(sut.guard(userWithRole("webmaster"))).to.be.true;
    });

    it("accepts a president", () => {
      expect(sut.guard(userWithRole("president"))).to.be.true;
    });

    it("rejects a gig editor", () => {
      expect(sut.guard(userWithRole("gig_editor"))).to.be.false;
    });
  });
}
