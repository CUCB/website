/// <reference types="Cypress" />

import { HASHED_PASSWORDS } from "../../database/users";
import { String } from "runtypes";

const gig = {
  id: "5765456",
  type: "1",
  title: "A gig to sign up to",
  admins_only: false,
  allow_signups: true,
  date: Cypress.DateTime.local().plus({ months: 1 }).toJSDate(),
  time: "21:00",
};

const userWithFullInfo: User & { password: string } = {
  id: "282947",
  first: "Furry",
  last: "Pocky",
  bio: "I am a tabby cat. Meow meow meow.",
  bioChangedDate: "2020-07-01",
  admin: "1",
  username: "fur23521",
  password: "abc123",
  email: "fur23521@cam.ac.uk",
  user_instruments: [["Guitar", "Strummy"], "Whistle(s)"],
  user_prefs: ["soundtech", "leader", "tshirt", "folder"],
  mobileContactInfo: "07123456789",
};

type RoleName = "webmaster" | "secretary" | "user";

const Role: Record<RoleName, User & { password: string }> = {
  webmaster: {
    id: "2829320",
    first: "Example",
    last: "Webmaster",
    admin: "1",
    username: "exc123",
    password: "abc123",
    email: "a_webmaster@gmail.com",
  },
  user: {
    id: "2834914",
    first: "Example",
    last: "User",
    admin: "9",
    username: "example_user",
    password: "abc123",
    email: "example_user@mail.com",
    bio: "I am an example user created for an automated test.",
    bioChangedDate: "2020-07-01",
  },
  secretary: {
    id: "28349134",
    first: "Example",
    last: "Secretary",
    admin: "3",
    username: "example_secretary",
    password: "abc123",
    email: "writeywrite@gmail.com",
  },
};

interface User {
  id: string;
  first: string;
  last: string;
  admin: string;
  password?: string;
  username: string;
  bio?: string;
  bioChangedDate?: string;
  email: string;
  user_instruments?: ([string, string] | string)[];
  instruments?: { id: string; nickname?: string; instrument: string }[];
  prefs?: { pref_id: string; value: boolean }[];
  user_prefs?: string[];
  mobileContactInfo?: string;
}

interface InsertableUser {
  id: string;
  first: string;
  last: string;
  admin: string;
  saltedPassword: string;
  username: string;
  bio?: string;
  email: string;
}

function loginAs(user: User & { password: string }): void {
  cy.login(user.username, user.password, {});
}

function urlFor(user?: User): string {
  return user ? `/members/users/${user.id}` : `/members/users`;
}

function insertableUser(user: User): InsertableUser {
  const modifiedUser = {
    ...user,
    saltedPassword: HASHED_PASSWORDS[user.password],
  };
  delete modifiedUser.password;
  return modifiedUser;
}

function revisitBeforePageAs(user: User & { password: string }): void {
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

function visitOnceAs(url: string, user: User & { password: string }): void {
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

type InstrumentId = string;
type AttributeId = string;

let instrumentIds: Map<string, InstrumentId> = new Map();
let attributeIds: Map<string, AttributeId> = new Map();

function populateInstrumentIds() {
  return cy.task("db:instrument_ids_by_name").then((instrumentRecord) => {
    // @ts-ignore
    instrumentIds = new Map(Object.entries(instrumentRecord));
  });
}

function populateAttributeIds() {
  return cy.task("db:attribute_ids_by_name").then((attributes) => {
    // @ts-ignore
    attributeIds = new Map(Object.entries(attributes));
  });
}

function insertUser(user: User): void {
  cy.task("db:delete_users_where", { id: user.id });
  const modifiedUser = { ...user };
  if (user.user_instruments) {
    modifiedUser.instruments = user.user_instruments.map((name) => {
      let fields = typeof name !== "string" ? { name: name[0], nickname: name[1] } : { name };
      return {
        id: (userInstrumentIdBase * ++userInstrumentCount).toString(),
        instrument: String.check(instrumentIds.get(fields.name)),
        ...fields,
        name: undefined,
      };
    });
    delete modifiedUser.user_instruments;
    modifiedUser.prefs =
      user.user_prefs &&
      user.user_prefs.map((name) => ({
        pref_id: String.check(attributeIds.get(name)),
        value: true,
      }));
    delete modifiedUser.user_prefs;
  }
  cy.task("db:create_custom_users", [insertableUser(modifiedUser)]);
}

describe("User page", () => {
  before(() => {
    populateInstrumentIds().then(() => {
      cy.log("populated instruments");
      populateAttributeIds().then(() => {
        cy.log("populated attributes");
        insertUser(userWithFullInfo);
        cy.log("inserted blah");
        for (let user in Role) {
          insertUser(Role[user]);
          cy.log(`inserted ${user}`);
        }
      });
    });
  });

  it("redirects to current users's page when no id is provided", () => {
    loginAs(userWithFullInfo);
    cy.visit("/members/users");
    cy.location("pathname").should("eq", urlFor(userWithFullInfo));
  });

  it("shows a help section that describes how to use the user editor");

  describe("instrument editor", () => {
    beforeEach(() => {
      cy.task("db:delete_instruments_for_user", Role.user.id);
      cy.task("db:create_gig", gig);
      loginAs(Role.user);
      cy.visit("/members/users");
      cy.waitForFormInteractive();
    });

    it("can add new instruments", () => {
      cy.get('[data-test="add-instrument"]').click();
      cy.get('[data-test="add-instrument-41"]').click();
      cy.get('[data-test="cancel-instrument-details"]').click();
      cy.contains("No instruments found.").should("be.visible");
      cy.get('[data-test="add-instrument"]').click();
      cy.get('[data-test="add-instrument-41"]').click();
      cy.get('[data-test="save-instrument-details"]').click();
      cy.get('[data-test="add-instrument"]').click();
      cy.get('[data-test="add-instrument-57"]').click();
      cy.get("#nickname").type("Parpy McParpface");
      cy.get('[data-test="save-instrument-details"]').click();

      cy.get('[data-test="name"]').contains('"Parpy McParpface" [Baritone Saxophone]').should("be.visible");
      cy.get('[data-test="name"]').contains("Cello").should("be.visible");

      cy.reload();

      cy.get('[data-test="name"]').contains('"Parpy McParpface" [Baritone Saxophone]').should("be.visible");
      cy.get('[data-test="name"]').contains("Cello").should("be.visible");
    });

    it("can hard delete an instrument that's never been used", () => {
      cy.get('[data-test="add-instrument"]').click();
      cy.get('[data-test="add-instrument-41"]').click();
      cy.get('[data-test="save-instrument-details"]').click();

      cy.get('[data-test="name"]').contains("Cello").should("be.visible");
      cy.get('[data-test^="delete-instrument-"]').click();
      cy.get('[data-test="name"]').should("not.exist");
    });

    it("can soft delete an instrument that's been played at a gig", () => {
      cy.get('[data-test="add-instrument"]').click();
      cy.get('[data-test="add-instrument-41"]').click();
      cy.get('[data-test="save-instrument-details"]').click();
      cy.get('[data-test="name"]')
        .contains("Cello")
        .parent()
        .invoke("attr", "data-test")
        .then((s) => s && s.split("user-instrument-")[1])
        .then((id) => {
          cy.request("POST", `/members/gigs/${gig.id}/signup`, { user_available: true, user_only_if_necessary: false });
          cy.request("POST", `/members/gigs/${gig.id}/signup`, { insert: [{ id }], delete: [] });
          cy.get(`[data-test="delete-instrument-${id}"]`).click();
          cy.get(`[data-test="delete-instrument-${id}"]`).contains("Restore").should("be.visible");
          cy.get("[data-test=name]")
            .contains("Cello")
            .should("have.regexCSS", "text-decoration", /line-through/);
          cy.reload();
          cy.get("[data-test=name]")
            .contains("Cello")
            .should("have.regexCSS", "text-decoration", /line-through/);
          cy.waitForFormInteractive();
          cy.get(`[data-test="delete-instrument-${id}"]`).contains("Restore").click();
          cy.get("[data-test=name]")
            .contains("Cello")
            .should("not.have.regexCSS", "text-decoration", /line-through/);
        });
    });

    it("can change the nicknames of existing instruments", () => {
      cy.get('[data-test="add-instrument"]').click();
      cy.get('[data-test="add-instrument-57"]').click();
      cy.get('[data-test="save-instrument-details"]').click();
      cy.get('[data-test="name"]').contains("Baritone Saxophone").should("be.visible");

      cy.get("[data-test=name]").parent().contains("Edit").click();
      cy.get("#nickname").type("Parpy McParpface");
      cy.get('[data-test="save-instrument-details"]').click();

      cy.get('[data-test="name"]').contains('"Parpy McParpface" [Baritone Saxophone]').should("be.visible");

      cy.reload();

      cy.get('[data-test="name"]').contains('"Parpy McParpface" [Baritone Saxophone]').should("be.visible");
      cy.waitForFormInteractive();
      cy.get("[data-test=name]").parent().contains("Edit").click();
      cy.get("#nickname").clear();
      cy.get('[data-test="save-instrument-details"]').click();
      cy.get("[data-test=name]").should("have.text", "Baritone Saxophone");
    });

    it("can change the type of existing instruments", () => {
      cy.get('[data-test="add-instrument"]').click();
      cy.get('[data-test="add-instrument-57"]').click();
      cy.get('[data-test="save-instrument-details"]').click();
      cy.get('[data-test="name"]').contains("Baritone Saxophone").should("be.visible");

      cy.get("[data-test=name]").parent().contains("Edit").click();
      cy.get('[data-test="change-instrument-type"]').click();
      cy.get('[data-test="add-instrument-55"]').click();
      cy.get("#nickname").type("Less Parpy");
      cy.get('[data-test="save-instrument-details"]').click();
      cy.get('[data-test="name"]').should("have.text", '"Less Parpy" [Tenor Saxophone]');
      cy.reload();
      cy.get('[data-test="name"]').should("have.text", '"Less Parpy" [Tenor Saxophone]');
    });
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
      cy.request({ method: "DELETE", url: `/members/images/users/${Role.user.id}.jpg`, failOnStatusCode: false });
      cy.visit(`/members/users/${Role.user.id}`);

      cy.get('blockquote[data-test="bio-content"]').should("contain.text", Role.user.bio);
      cy.get('[data-test="bio-name"]').should("include.text", Role.user.first).and("include.text", "July 2020");
      cy.waitForFormInteractive();

      cy.get('[data-test="edit-bio"]').click();
      cy.get("textarea[data-test=bio-content]").type("An example biography.");
      cy.get('[data-test="save-bio"]').click();

      cy.get('blockquote[data-test="bio-content"]').should("contain.text", "An example biography");
      cy.get('[data-test="bio-name"]')
        .should("include.text", Role.user.first)
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

      // TODO make this reliable or just kill this
      // cy.get('[data-testid="cropper"]').trigger("wheel", {
      //   deltaY: -120.666666,
      //   wheelDelta: 120,
      //   wheelDeltaX: 0,
      //   wheelDeltaY: 120,
      //   bubbles: true,
      // });
      // cy.get("[data-testid=cropper]").then((elem) => {
      //   const bound = elem[0].getBoundingClientRect();
      //   cy.get('[data-testid="cropper"]')
      //     .trigger("mousedown")
      //     .trigger("mousemove", { clientX: 190 + bound.left, clientY: 250 + bound.top })
      //     .trigger("mouseup");
      // });

      cy.get('[data-testid="cropper"]').should("be.visible");
      cy.get("button").contains("Upload").click();
      cy.get(`[data-test="profile-picture-2834914"]`).should("be.visible");

      // TODO make me reliable across cy:open and cy:run
      // ... alternatively, at least check this isn't none.jpg (the placeholder image)
      // cy.get(`[data-test="profile-picture-2834914"]`).then((elem) => {
      //   const url = elem[0].src;
      //   cy.readFile("cypress/2834914.jpg").then((snapshot) => {
      //     cy.request(url).then((newlyUploaded) => {
      //       const snapshotHash = crypto.createHash("sha1").update(snapshot).digest("hex");
      //       const newlyUploadedHash = crypto.createHash("sha1").update(newlyUploaded.body).digest("hex");
      //       expect(snapshotHash).to.equal(newlyUploadedHash);
      //     });
      //   });
      // });
    });
  });

  describe("automatic biography", () => {
    describe("basic details", () => {
      beforeEach(() => {
        cy.task("db:update_user", [userWithFullInfo.id, { joinDate: null, lastLoginDate: null }]);
      });

      visitOnceAs(urlFor(userWithFullInfo), Role.user);

      it("contains the user's name, when they joined and logged in", () => {
        cy.contains(`${userWithFullInfo.first} ${userWithFullInfo.last}`);
        cy.contains("joined the site before records began");
        cy.contains("hasn't been seen in a long time");

        cy.task("db:update_user", [
          userWithFullInfo.id,
          {
            joinDate: "2019-02-05T19:06:00Z",
            lastLoginDate: "2021-05-13T10:15:32Z",
          },
        ]);

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
        cy.get("#first-name").should("have.value", userWithFullInfo.first);
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
        cy.intercept("POST", `/members/users/${userWithFullInfo.id}`).as("saveDetails");
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

      it("can change their own password");

      it("can edit their own instruments", () => {
        cy.waitForFormInteractive();
        cy.get('[data-test="name"]').contains("Guitar").should("be.visible");
        cy.get('[data-test="name"]').contains("Whistle").should("be.visible");
        cy.get("button").contains("Add new instrument").click();
        cy.get('[data-test="add-instrument-55"]').click();
        cy.get("#nickname").clear();
        cy.get("#nickname").type("Parpy McParpface");
        cy.get('[data-test="save-instrument-details"]').click();
        cy.get("tr").contains("Whistle").parent().contains("Delete").click();
        cy.get('[data-test="name"]').contains("Guitar").should("be.visible");
        // TODO check that whistle disappeared
        cy.get('[data-test="name"]').contains('"Parpy McParpface" [Tenor Saxophone]').should("be.visible");
        // TODO check we can update nicknames??
      });

      it("cannot delete an instrument that's been played at a gig?");

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
