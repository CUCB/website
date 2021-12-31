/// <reference types="Cypress" />

import { AllInstrumentNames, OnConflictUserInstruments } from "../../database/instruments";
import { AllAttributes, CreateUser, HASHED_PASSWORDS, OnConflictUserPrefs } from "../../database/users";

const userWithFullInfo = {
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
};

type RoleName = "webmaster" | "secretary" | "user";

const Role: Record<RoleName, User> = {
  webmaster: {
    id: 2829320,
    firstName: "Example",
    lastName: "Webmaster",
    admin: 9,
    username: "exc123",
    password: "abc123",
    email: "a_webmaster@gmail.com",
  },
  user: {
    id: 2834914,
    firstName: "Example",
    lastName: "User",
    admin: 1,
    username: "example_user",
    password: "abc123",
    email: "example_user@mail.com",
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
  email: string;
  user_instruments?: ([string, string] | string)[];
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

function loginAs(user: User) {
  cy.login(user.username, user.password);
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

function revisitBeforePageAs(user: User) {
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

function visitOnceAs(url: string, user: User) {
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

function populateAttributeIds() {
  return cy
    .executeQuery(AllAttributes)
    .its("cucb_user_pref_types")
    .then((attributeList) => {
      for (let attribute of attributeList) {
        attributeIds = attributeIds.set(attribute.name.split(".")[1], attribute.id);
      }
    });
}

function insertUser(user: User) {
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

  it("shows a help section that describes how to use the user editor", () => {});

  describe("instrument editor", () => {
    it("can add new instruments", () => {});

    it("can hard delete an instrument that's never been used", () => {});

    it("can soft delete an instrument that's been played at a gig", () => {});

    it("can change the nicknames of existing instruments", () => {});

    it("can change the type of existing instruments");
  });

  describe("details form", () => {
    it("can update the password", () => {});

    it("rejects non matching passwords", () => {});

    it("requires a name and email address", () => {});

    it("can update 'bits and bobs'", () => {});
  });

  describe("automatic biography", () => {
    describe("basic details", () => {
      visitOnceAs(urlFor(userWithFullInfo), Role.user);

      it("contains the user's name", () => {});

      it("shows when they joined and last logged in", () => {});
    });

    describe("instruments", () => {
      visitOnceAs(urlFor(userWithFullInfo), Role.user);

      it("specifies their primary intrument", () => {});

      it("lists secondary instruments", () => {});

      it("shows footnote for novelty instruments if they exist", () => {});
    });
  });

  describe("past gig details", () => {
    visitOnceAs(urlFor(userWithFullInfo), userWithFullInfo);

    it("shows a list of past gigs with links to the gig pages", () => {});

    it("shows a list of who the user has played gigs with", () => {});
  });

  describe("a webmaster interacting with", () => {
    describe("other users", () => {
      visitOnceAs(urlFor(userWithFullInfo), Role.webmaster);

      it("can edit their details", () => {});

      it("can edit their instruments", () => {});

      it("can edit their permissions", () => {});
    });

    describe("themselves", () => {
      visitOnceAs(urlFor(), Role.webmaster);

      it("cannot edit their own permissions", () => {});
    });
  });

  describe("a normal user interacting with", () => {
    describe("other users", () => {
      visitOnceAs(urlFor(userWithFullInfo), Role.user);

      it("cannot see their contact information", () => {});

      it("cannot edit their details", () => {});

      it("can see profile picture, name, and biography", () => {});
    });

    describe("themselves", () => {
      visitOnceAs(urlFor(userWithFullInfo), userWithFullInfo);

      it("can edit their own details", () => {});

      it("can edit their own instruments", () => {});

      it("cannot edit their own permissions", () => {});
    });
  });

  describe("a secretary", () => {
    visitOnceAs(urlFor(userWithFullInfo), Role.secretary);

    it("can see other users' contact information", () => {});

    it("can edit other users' details", () => {});

    it("can edit their own details", () => {});
  });
});
