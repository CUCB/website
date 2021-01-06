import { AllGigTypes, UpdateGigType } from "../../database/gigs";
import { AllInstrumentNames, OnConflictLineupInstruments, OnConflictUserInstruments } from "../../database/instruments";
import { CreateGig } from "../../database/gigs";
import {
  CreateUser,
  HASHED_PASSWORDS,
  OnConflictUser,
  OnConflictUserPrefs,
  AllAttributes,
  CreateLineup,
} from "../../database/users";

describe("lineup editor", () => {
  let signups = [
    {
      user: { first: "Huggable", last: "Treasurechest", gig_notes: "Can only lead on fiddle", user_prefs: ["leader"] },
      user_available: true,
      user_instruments: ["Fiddle", "Mandolin"],
      user_notes: "Fiddle if possible, please",
    },
    {
      user: { first: "Infinite", last: "Smasher", gig_notes: "", user_prefs: ["soundtech"] },
      user_available: true,
      user_instruments: ["Bodhran"],
      user_notes: "",
    },
  ];

  let signupsToInsert, availablePeople;
  beforeEach(() => {
    cy.executeMutation(CreateGig, {
      variables: {
        id: 15274,
        title: "Cypress Demo Gig",
        type: 1,
        adminsOnly: false,
        allowSignups: false,
      },
    });
    cy.executeQuery(AllAttributes)
      .its("cucb_user_pref_types")
      .then((attributeList) => {
        let attributeIds = new Map();
        for (let attribute of attributeList) attributeIds.set(attribute.name.split(".")[1], attribute.id);
        cy.executeQuery(AllInstrumentNames)
          .its("cucb_instruments")
          .then((instrumentList) => {
            let userIdBase = 283472;
            let userInstrumentIdBase = 283479;
            let userInstrumentCount = 0;
            let userCount = 0;
            signupsToInsert = [];
            let instrumentIds = new Map();
            for (let instrument of instrumentList) {
              instrumentIds = instrumentIds.set(instrument.name, instrument.id);
            }
            for (let person of signups) {
              person.user.id = userIdBase * ++userCount;
              if (
                person.user_instruments &&
                person.user_instruments.length > 0 &&
                typeof person.user_instruments[0] === "string"
              ) {
                person.user_instruments = person.user_instruments.map((name) => ({
                  id: userInstrumentIdBase * ++userInstrumentCount,
                  instr_id: instrumentIds.get(name),
                  name,
                }));
              }
              let userPrefs = person.user.user_prefs.map((name) => ({
                pref_id: attributeIds.get(name),
                value: true,
              }));
              let signupInstruments = person.user_instruments.map(({ id, instr_id }) => ({
                approved: null,
                user_instrument: {
                  data: {
                    id,
                    instr_id,
                    user_id: person.user.id,
                  },
                  on_conflict: OnConflictUserInstruments,
                },
              }));
              signupsToInsert.push({
                ...person,
                gig_id: 15274,
                user: {
                  data: {
                    email: `user${person.user.id}@lineup-edit.or`,
                    username: `cypress_gig_lineup_u${person.user.id}`,
                    admin: 9,
                    ...person.user,
                    user_prefs: { data: userPrefs, on_conflict: OnConflictUserPrefs },
                  },
                  on_conflict: OnConflictUser,
                },
                user_instruments: { data: signupInstruments, on_conflict: OnConflictLineupInstruments },
                leader: false,
                money_collector: false,
                money_collector_notified: false,
                equipment: false,
                driver: false,
                approved: null,
              });
            }
            cy.executeMutation(CreateLineup, { variables: { entries: signupsToInsert } });
            availablePeople = signups.filter((signup) => signup.user_available && !signup.user_only_if_necessary);
          });
      });
    cy.executeMutation(CreateUser, {
      variables: {
        id: 27250,
        username: "cypress_user",
        saltedPassword: HASHED_PASSWORDS.abc123,
        admin: 9,
        email: "cypress.user@cypress.io",
        firstName: "Cypress",
        lastName: "User",
      },
    });
    cy.executeMutation(CreateUser, {
      variables: {
        id: 27382,
        username: "cypress_president",
        saltedPassword: HASHED_PASSWORDS.abc123,
        admin: 2,
        email: "cucb.president@cypress.io",
        firstName: "Cypress",
        lastName: "President",
      },
    });
  });

  context("authorized as president", () => {
    beforeEach(() => cy.login("cypress_president", "abc123"));

    it("gives a 404 error when the gig doesn't exist", () => {
      cy.request({
        url: "/members/gigs/15275/edit-lineup",
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 404);
    });

    it("gives a 404 error if the gig is kit hire, calendar event, cancelled or an enquiry", () => {
      cy.executeQuery(AllGigTypes)
        .its("cucb_gig_types")
        .then((gigTypes) => {
          for (let type of gigTypes.filter((type) => type.code !== "gig")) {
            cy.log(`Testing ${type.title}`);
            cy.executeMutation(UpdateGigType, { variables: { gigId: 15274, typeId: type.id } }, { log: false });
            cy.request({
              url: "/members/gigs/15274/edit-lineup",
              failOnStatusCode: false,
            })
              .its("status")
              .should("eq", 404);
          }
        });
    });

    context("viewing valid gig", () => {
      beforeEach(() => {
        cy.login("cypress", "abc123");
        cy.visit("/members/gigs/15274/edit-lineup");
      });
      it("lists the people and instruments who have signed up to the gig", () => {
        for (let person of availablePeople) {
          cy.get(`[data-test=lineup-editor-applicants] [data-test=member-${person.user.id}]`).then((row) => {
            cy.wrap(row).contains(`${person.user.first} ${person.user.last}`);
            if (person.user.user_prefs.includes("leader")) {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-leader]`)
                .should("be.visible")
                .click()
                .hasTooltip(`${person.user.first} can lead`);
              cy.wrap(row).click("topLeft");
            } else {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-leader]`).should(
                "not.exist",
              );
            }
            if (person.user.user_prefs.includes("soundtech")) {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-soundtech]`)
                .should("be.visible")
                .click()
                .hasTooltip(`${person.user.first} can tech`);
              cy.wrap(row).click("topLeft");
            } else {
              cy.get(
                `[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-soundtech]`,
              ).should("not.exist");
            }
            if (person.user.user_prefs.includes("driver")) {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-driver]`)
                .should("be.visible")
                .click()
                .hasTooltip(`${person.user.first} can drive`);
              cy.wrap(row).click("topLeft");
            } else {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-driver]`).should(
                "not.exist",
              );
            }
            if (person.user.user_prefs.includes("car")) {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-car]`)
                .should("be.visible")
                .click()
                .hasTooltip(`${person.user.first} has a car`);
              cy.wrap(row).click("topLeft");
            } else {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-car]`).should(
                "not.exist",
              );
            }
          });
        }
      });
    });
  });

  context("not logged in", () => {
    it("isn't accessible", () => {
      cy.request({
        url: "/members/gigs/15274/edit-lineup",
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 401);
    });

    it("shows not logged in error on non existent gig", () => {
      cy.request({
        url: "/members/gigs/15275/edit-lineup",
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 401);
    });
  });

  context("authorized as normal user", () => {
    beforeEach(() => {
      cy.login("cypress_user", "abc123");
    });

    it("isn't accessible", () => {
      cy.request({
        url: "/members/gigs/15274/edit-lineup",
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 403);
    });
  });
});
