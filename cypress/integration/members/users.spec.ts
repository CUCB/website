/// <reference types="Cypress" />

import { AllInstrumentNames, OnConflictUserInstruments } from "../../database/instruments";
import {
  AllAttributes,
  CreateUser,
  DeleteUsers,
  HASHED_PASSWORDS,
  OnConflictUserPrefs,
  SetJoinAndLoginDate,
} from "../../database/users";
import crypto from "crypto";

const userWithFullInfo: User = {
  id: 282947,
  firstName: "Furry",
  lastName: "Pocky",
  bio: "I am a tabby cat. Meow meow meow.",
  bioChangedDate: "2020-07-01",
  admin: 1,
  username: "fur23521",
  password: "abc123",
  email: "fur23521@cam.ac.uk",
  user_instruments: [["Guitar", "Strummy"], "Whistle(s)"],
  user_prefs: ["soundtech", "leader", "tshirt", "folder"],
  mobileContactInfo: "07123456789",
};

type RoleName = "webmaster" | "secretary" | "user";

const Role: Record<RoleName, User> = {
  webmaster: {
    id: 2829320,
    firstName: "Example",
    lastName: "Webmaster",
    admin: 1,
    username: "exc123",
    password: "abc123",
    email: "a_webmaster@gmail.com",
  },
  user: {
    id: 2834914,
    firstName: "Example",
    lastName: "User",
    admin: 9,
    username: "example_user",
    password: "abc123",
    email: "example_user@mail.com",
    bio: "I am an example user created for an automated test.",
    bioChangedDate: "2020-07-01",
  },
  secretary: {
    id: 28349134,
    firstName: "Example",
    lastName: "Secretary",
    admin: 3,
    username: "example_secretary",
    password: "abc123",
    email: "writeywrite@gmail.com",
  },
};

interface User {
  id: number;
  firstName: string;
  lastName: string;
  admin: number;
  password: string;
  username: string;
  bio?: string;
  bioChangedDate?: string;
  email: string;
  user_instruments?: ([string, string] | string)[];
  userInstruments?: {
    on_conflict: typeof OnConflictUserInstruments;
    data: { id: number; nickname?: string; instr_id: number }[];
  };
  userPrefs?: {
    on_conflict: typeof OnConflictUserPrefs;
    data: { pref_id: number; value: boolean }[];
  };
  user_prefs?: string[];
  mobileContactInfo?: string;
}

interface InsertableUser {
  id: number;
  firstName: string;
  lastName: string;
  admin: number;
  saltedPassword: string;
  username: string;
  bio?: string;
  email: string;
}

function loginAs(user: User): void {
  cy.loginWithoutCySession(user.username, user.password, {});
}

function urlFor(user?: User): string {
  return user ? `/members/user/${user.id}` : `/members/user`;
}

function insertableUser(user: User): InsertableUser {
  const modifiedUser = {
    ...user,
    saltedPassword: HASHED_PASSWORDS[user.password],
  };
  delete modifiedUser.password;
  return modifiedUser;
}

function revisitBeforePageAs(user: User): void {
  // We want to stay on the same page, but since the sessions feature was introduced,
  // we get redirected to about:blank between tests. Hitting back in the browser is
  // generally much faster than doing a full page load, and we're not editing data
  // so there's no benefit to repeatedly reloading the page in full.
  cy.url().then((url) => {
    if (url === "about:blank") {
      loginAs(user);
      cy.go("back");
    }
  });
}

function visitOnceAs(url: string, user: User): void {
  before(() => {
    loginAs(user);
    cy.visit(url);
  });

  beforeEach(() => {
    revisitBeforePageAs(user);
  });
}

let userInstrumentIdBase = 283283;
let userInstrumentCount = 0;

type InstrumentId = number;
type AttributeId = number;

let instrumentIds: Map<string, InstrumentId> = new Map();
let attributeIds: Map<string, AttributeId> = new Map();

function populateInstrumentIds() {
  return cy
    .executeQuery(AllInstrumentNames)
    .its("cucb_instruments")
    .then((instrumentList) => {
      for (let instrument of instrumentList) {
        instrumentIds = instrumentIds.set(instrument.name, instrument.id);
      }
    });
}

function populateAttributeIds(): Cypress.Chainable<void> {
  return cy
    .executeQuery(AllAttributes)
    .its("cucb_user_pref_types")
    .then((attributeList) => {
      for (let attribute of attributeList) {
        attributeIds = attributeIds.set(attribute.name.split(".")[1], attribute.id);
      }
    });
}

function insertUser(user: User): void {
  cy.executeMutation(DeleteUsers, { variables: { ids: [user.id] } });
  const modifiedUser = { ...user };
  if (user.user_instruments) {
    modifiedUser.userInstruments = {
      on_conflict: OnConflictUserInstruments,
      data: user.user_instruments.map((name) => {
        let fields = typeof name !== "string" ? { name: name[0], nickname: name[1] } : { name };
        return {
          id: userInstrumentIdBase * ++userInstrumentCount,
          instr_id: instrumentIds.get(fields.name),
          ...fields,
          name: undefined,
        };
      }),
    };
    delete modifiedUser.user_instruments;
    modifiedUser.userPrefs = user.user_prefs && {
      data: user.user_prefs.map((name) => ({
        pref_id: attributeIds.get(name),
        value: true,
      })),
      on_conflict: OnConflictUserPrefs,
    };
    delete modifiedUser.user_prefs;
  }
  cy.executeMutation(CreateUser, { variables: insertableUser(modifiedUser) });
}

describe("User page", () => {
  before(() => {
    populateInstrumentIds().then(() => {
      populateAttributeIds().then(() => {
        insertUser(userWithFullInfo);
        for (let user in Role) {
          insertUser(Role[user]);
        }
      });
    });
  });

  it("redirects to current users's page when no id is provided", () => {
    loginAs(userWithFullInfo);
    cy.visit("/members/user");
    cy.location("pathname").should("eq", urlFor(userWithFullInfo));
  });

  it("shows a help section that describes how to use the user editor");

  describe("instrument editor", () => {
    beforeEach(() => {
      loginAs(Role.user);
      cy.visit("/members/user");
    });
    it("can add new instruments", () => {});

    it("can hard delete an instrument that's never been used", () => {});

    it("can soft delete an instrument that's been played at a gig", () => {});

    it("can change the nicknames of existing instruments", () => {});

    it("can change the type of existing instruments", () => {});
  });

  describe("details form", () => {
    it("can update the password");

    it("rejects non matching passwords");

    it("requires a name and email address");

    it("can update 'bits and bobs'");
  });

  describe("manual biography", () => {
    it("can be modified, deleted and added", () => {
      populateInstrumentIds().then(() => {
        populateAttributeIds().then(() => {
          insertUser(userWithFullInfo);
          for (let user in Role) {
            insertUser(Role[user]);
          }
        });
      });
      loginAs(Role.user);
      cy.request({ method: "DELETE", url: `/members/images/users/2834914.jpg`, failOnStatusCode: false });
      cy.visit("/members/user");

      cy.get('blockquote[data-test="bio-content"]').should("contain.text", Role.user.bio);
      cy.get('[data-test="bio-name"]').should("include.text", Role.user.firstName).and("include.text", "July 2020");

      cy.waitForFormInteractive();

      cy.get('[data-test="edit-bio"]').click();
      cy.get("textarea[data-test=bio-content]").type("An example biography.");
      cy.get('[data-test="save-bio"]').click();

      cy.get('blockquote[data-test="bio-content"]').should("contain.text", "An example biography");
      cy.get('[data-test="bio-name"]')
        .should("include.text", Role.user.firstName)
        .and("include.text", Cypress.DateTime.now().toFormat("MMMM y"));

      cy.reload();
      cy.get('blockquote[data-test="bio-content"]').should("contain.text", "An example biography");
      cy.waitForFormInteractive();

      cy.get('[data-test="edit-bio"]').click();
      cy.get("textarea[data-test=bio-content]").clear();
      cy.get('[data-test="save-bio"]').click();

      cy.get('blockquote[data-test="bio-content"]').should("not.exist");

      cy.reload();
      cy.get('blockquote[data-test="bio-content"]').should("not.exist");
      cy.waitForFormInteractive();

      cy.get('[data-test="edit-bio"]').click();
      cy.get("textarea[data-test=bio-content]").type("A new biography, after I deleted the last one.");
      cy.get('[data-test="save-bio"]').click();
      cy.get('blockquote[data-test="bio-content"]').should(
        "contain.text",
        "A new biography, after I deleted the last one.",
      );

      cy.contains("Upload new picture").click();
      cy.get("input[type=file]").selectFile("cypress/DSC_0141.JPG");
      cy.get('[data-testid="cropper"]').trigger("wheel", {
        deltaY: -120.666666,
        wheelDelta: 120,
        wheelDeltaX: 0,
        wheelDeltaY: 120,
        bubbles: true,
      });
      cy.get("[data-testid=cropper]").then((elem) => {
        const bound = elem[0].getBoundingClientRect();
        cy.get('[data-testid="cropper"]')
          .trigger("mousedown")
          .trigger("mousemove", { clientX: 190 + bound.left, clientY: 250 + bound.top })
          .trigger("mouseup");
      });

      cy.get("button").contains("Upload").click();
      cy.get(`[data-test="profile-picture-2834914"]`).should("be.visible");
      cy.get(`[data-test="profile-picture-2834914"]`).then((elem) => {
        const url = elem[0].src;
        cy.readFile("cypress/2834914.jpg").then((snapshot) => {
          cy.request(url).then((newlyUploaded) => {
            const snapshotHash = crypto.createHash("sha1").update(snapshot).digest("hex");
            const newlyUploadedHash = crypto.createHash("sha1").update(newlyUploaded.body).digest("hex");
            expect(snapshotHash).to.equal(newlyUploadedHash);
          });
        });
      });
    });
  });

  describe("automatic biography", () => {
    describe("basic details", () => {
      beforeEach(() => {
        cy.executeMutation(SetJoinAndLoginDate, {
          variables: { userId: userWithFullInfo.id, joinDate: null, lastLoginDate: null },
        });
      });

      visitOnceAs(urlFor(userWithFullInfo), Role.user);

      it("contains the user's name, when they joined and logged in", () => {
        cy.contains(`${userWithFullInfo.firstName} ${userWithFullInfo.lastName}`);
        cy.contains("joined the site before records began");
        cy.contains("hasn't been seen in a long time");

        cy.executeMutation(SetJoinAndLoginDate, {
          variables: {
            userId: userWithFullInfo.id,
            joinDate: "2019-02-05T19:06:00Z",
            lastLoginDate: "2021-05-13T10:15:32Z",
          },
        });

        cy.reload();

        cy.contains("joined the site in February 2019");
        cy.contains("was last seen online in May 2021");
      });
    });

    describe("instruments", () => {
      visitOnceAs(urlFor(userWithFullInfo), Role.user);

      it("specifies their primary intrument");

      it("lists secondary instruments");

      it("shows footnote for novelty instruments if they exist");
    });
  });

  describe("past gig details", () => {
    visitOnceAs(urlFor(userWithFullInfo), userWithFullInfo);

    it("shows a list of past gigs with links to the gig pages");

    it("shows a list of who the user has played gigs with");
  });

  describe("a webmaster interacting with", () => {
    describe("other users", () => {
      visitOnceAs(urlFor(userWithFullInfo), Role.webmaster);

      it("can edit their details");

      it("can edit their instruments");

      it("can edit their permissions");
    });

    describe("themselves", () => {
      visitOnceAs(urlFor(), Role.webmaster);

      it("cannot edit their own permissions");
    });
  });

  describe("a normal user interacting with", () => {
    const mobileNumber = () => cy.get("[data-test=mobile-number]");
    const email = () => cy.get("[data-test=email]");

    describe("other users", () => {
      visitOnceAs(urlFor(userWithFullInfo), Role.user);

      it("cannot see their contact information", () => {
        mobileNumber().should("not.exist");
        email().should("not.exist");
      });

      it("cannot edit their details");

      it("can see profile picture, name, and biography");
    });

    describe("themselves", () => {
      visitOnceAs(urlFor(userWithFullInfo), userWithFullInfo);

      it("can edit their own details", () => {
        mobileNumber().should("contain.text", userWithFullInfo.mobileContactInfo);
        email().should("contain.text", userWithFullInfo.email);
        cy.waitForFormInteractive();
        cy.get("#first-name").should("have.value", userWithFullInfo.firstName);
        cy.get("#first-name").clear();
        // Check that we have a vaguely sensible tab order, at least for name
        cy.get("#first-name").type("Firstname").tab().type("Lastname");
        cy.get("#mobile").clear();
        cy.get("#mobile").type("07987654321");
        cy.get("#location").clear();
        cy.get("#location").type("Somewhere in Cambridge");
        cy.get("#dietaries").clear();
        cy.get("#dietaries").type("None");

        cy.get('[for="has-folder"]').click();
        cy.get("#has-folder").uncheck();
        cy.get('[for="has-car"]').click();
        cy.get("#has-car").check();
        cy.get('[for="is-driver"]').click();
        cy.get("#is-driver").check();
        cy.get('[for="can-tech"]').click();
        cy.get("#can-tech").uncheck();
        cy.intercept("POST", "/v1/graphql").as("saveDetails");
        cy.get('[data-test="save-user-details"]').click();

        cy.wait("@saveDetails");
        cy.contains("Saved").should("be.visible");

        cy.get("#has-folder").should("not.be.checked");
        cy.get("#is-driver").should("be.checked");
        mobileNumber().should("contain.text", "07987654321");

        cy.reload();

        cy.get("#has-folder").should("not.be.checked");
        cy.get("#is-driver").should("be.checked");
        mobileNumber().should("contain.text", "07987654321");
        email().should("contain.text", userWithFullInfo.email);
      });

      it("can edit their own instruments", () => {});

      it("cannot edit their own permissions");
    });
  });

  describe("a secretary", () => {
    visitOnceAs(urlFor(userWithFullInfo), Role.secretary);

    it("can see other users' contact information", () => {});

    it("can edit other users' details", () => {});

    it("can edit their own details", () => {});
  });
});
