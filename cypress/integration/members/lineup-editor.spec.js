import { AllGigTypes, UpdateGigType } from "../../database/gigs";
import { AllInstrumentNames, OnConflictLineupInstruments, OnConflictUserInstruments } from "../../database/instruments";
import { CreateGig, ClearLineupForGig } from "../../database/gigs";
import {
  CreateUser,
  HASHED_PASSWORDS,
  OnConflictUser,
  OnConflictUserPrefs,
  AllAttributes,
  CreateLineup,
  DeleteUsers,
} from "../../database/users";

const click = ($el) => $el.click();

describe("lineup editor", () => {
  let signups = [
    // Names from http://tabbycats.club/
    {
      user: { first: "Huggable", last: "Treasurechest", gig_notes: "Can only lead on fiddle", user_prefs: ["leader"] },
      user_available: true,
      user_instruments: [["Fiddle", "Stringy"], "Mandolin"],
      user_notes: "Fiddle if possible, please",
    },
    {
      user: { first: "Infinite", last: "Smasher", gig_notes: "", user_prefs: ["soundtech"] },
      user_available: true,
      user_instruments: ["Bodhran"],
      user_notes: "",
    },
    {
      user: { first: "Poofy", last: "Bubby", gig_notes: "", user_prefs: ["soundtech", "driver", "car"] },
      user_available: true,
      user_only_if_necessary: true,
      user_instruments: ["Guitar", "Whistle(s)"],
      user_notes: "",
    },
    {
      user: { first: "Sneaky", last: "Burglar", gig_notes: "", user_prefs: [] },
      user_available: false,
      user_only_if_necessary: false,
      user_instruments: [],
      user_notes: "",
    },
  ];

  let signupsToInsert;
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
    cy.executeMutation(ClearLineupForGig, { variables: { id: 15274 } });
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
                (typeof person.user_instruments[0] === "string" ||
                  (typeof person.user_instruments[0] === "object" && person.user_instruments[0].hasOwnProperty(0)))
              ) {
                person.user_instruments = person.user_instruments.map((name) => {
                  let fields = typeof name !== "string" ? { name: name[0], nickname: name[1] } : { name };
                  return {
                    id: userInstrumentIdBase * ++userInstrumentCount,
                    instr_id: instrumentIds.get(fields.name),
                    ...fields,
                  };
                });
                cy.log(person.user_instruments);
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
            cy.executeMutation(DeleteUsers, {
              variables: { ids: signupsToInsert.map((signup) => signup.user.data.id) },
            });
            cy.executeMutation(CreateLineup, { variables: { entries: signupsToInsert } });
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
        for (let person of signups) {
          let listSelector = person.approved
            ? "lineup-editor-approved"
            : person.user_available
            ? "lineup-editor-applicants"
            : "lineup-editor-nope";
          cy.get(`[data-test=${listSelector}] [data-test=member-${person.user.id}]`).then(($row) => {
            if (person.user.user_prefs.includes("leader")) {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-leader]`)
                .should("be.visible")
                .click()
                .hasTooltip(`${person.user.first} can lead`);
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
            } else {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-car]`).should(
                "not.exist",
              );
            }
            cy.wrap($row).within(() => {
              for (let instrument of person.user_instruments) {
                cy.contains(instrument.name)
                  .should("be.visible")
                  .parentsUntil("[data-test=instrument-row]")
                  .within(() => {
                    cy.get("[data-test=instrument-maybe]").should("have.attr", "aria-selected").and("eq", "true");
                  });
              }
            });
          });
        }
      });

      it("can approve/discard people", () => {
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-approve]`)
          .pipe(click)
          .should(($el) => expect($el).to.not.exist);
        cy.get(`[data-test=lineup-editor-approved] [data-test=member-${signups[0].user.id}]`).should("be.visible");
        cy.get(`[data-test=lineup-editor-applicants] [data-test=member-${signups[0].user.id}]`).should("not.exist");
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=person-approve]`)
          .pipe(click)
          .should(($el) => expect($el).to.not.exist);
        cy.get(`[data-test=lineup-editor-approved] [data-test=member-${signups[1].user.id}]`).should("be.visible");
        cy.get(`[data-test=lineup-editor-applicants] [data-test=member-${signups[1].user.id}]`).should("not.exist");
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-unapprove]`)
          .pipe(click)
          .should(($el) => expect($el).to.not.exist);
        cy.get(`[data-test=lineup-editor-applicants] [data-test=member-${signups[0].user.id}]`).should("be.visible");
        cy.get(`[data-test=lineup-editor-approved] [data-test=member-${signups[0].user.id}]`).should("not.exist");
        cy.get(`[data-test=member-${signups[2].user.id}] [data-test=person-discard]`)
          .pipe(click)
          .should(($el) => expect($el).to.not.exist);
        cy.get(`[data-test=lineup-editor-nope] [data-test=member-${signups[2].user.id}]`).should("be.visible");
        cy.get(`[data-test=lineup-editor-applicants] [data-test=member-${signups[2].user.id}]`).should("not.exist");
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-discard]`)
          .pipe(click)
          .should(($el) => expect($el).to.not.exist);
        cy.get(`[data-test=lineup-editor-nope] [data-test=member-${signups[0].user.id}]`).should("be.visible");
        cy.get(`[data-test=lineup-editor-applicants] [data-test=member-${signups[0].user.id}]`).should("not.exist");
      });

      it("shows people in the correct sections", () => {
        cy.get(`[data-test=signup-yes]`).should("contain", `${signups[0].user.first} ${signups[0].user.last}`);
        cy.get(`[data-test=signup-maybe]`).should("contain", `${signups[2].user.first} ${signups[2].user.last}`);
        cy.get(`[data-test=signup-nope]`).should("contain", `${signups[3].user.first} ${signups[3].user.last}`);
        cy.get(`[data-test=member-${signups[3].user.id}] [data-test=person-discard]`).pipe(click).should("not.exist");
        cy.get(`[data-test=people-discarded] [data-test=member-${signups[3].user.id}]`).should("be.visible");
        cy.get(`[data-test=signup-nope] [data-test=member-${signups[3].user.id}]`).should("not.exist");
      });

      it("can select and discard instruments", () => {
        cy.get(`[data-test=instrument-${signups[0].user_instruments[1].id}] [data-test=instrument-yes]`).pipe(click).should("have.attr", "aria-selected");
        cy.get(`[data-test=instrument-${signups[0].user_instruments[0].id}] [data-test=instrument-no]`).pipe(click).should("have.attr", "aria-selected");
        cy.get(`[data-test=instrument-${signups[0].user_instruments[0].id}] [data-test=instrument-maybe]`).pipe(click).should("have.attr", "aria-selected");
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-discard]`).pipe(click).should("not.exist");
        cy.get(`[data-test=instrument-${signups[0].user_instruments[0].id}] [aria-selected=true]`).should("have.attr", "data-test", "instrument-maybe")
        cy.get(`[data-test=instrument-${signups[0].user_instruments[1].id}] [aria-selected=true]`).should("have.attr", "data-test", "instrument-yes")
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=person-approve]`).pipe(click).should("not.exist");
        cy.get(`[data-test=instrument-${signups[1].user_instruments[0].id}] [data-test=instrument-yes]`).pipe(click).should("have.attr", "aria-selected");
        cy.reload();
        cy.get(`[data-test=instrument-${signups[0].user_instruments[0].id}] [aria-selected=true]`).should("have.attr", "data-test", "instrument-maybe")
        cy.get(`[data-test=instrument-${signups[0].user_instruments[1].id}] [aria-selected=true]`).should("have.attr", "data-test", "instrument-yes")
        cy.get(`[data-test=instrument-${signups[1].user_instruments[0].id}] [aria-selected=true]`).should("have.attr", "data-test", "instrument-yes")
      });

      it("can assign roles to members of the lineup", () => {
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-approve]`).pipe(click).should("not.exist");
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=toggle-leader]`).click().should("have.attr", "aria-checked", "true");
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=person-approve]`).click();
        cy.get(`[data-test=member-${signups[3].user.id}] [data-test=person-approve]`).click();
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=toggle-equipment]`).click().should("have.attr", "aria-checked", "true");
        cy.get(`[data-test=member-${signups[3].user.id}]`).within(() => {
            cy.get(`[data-test=toggle-money_collector_notified]`).should("not.exist");

            cy.get(`[data-test=toggle-money_collector]`).click().should("have.attr", "aria-checked", "true");
            cy.get(`[data-test=toggle-money_collector_notified]`).click().should("have.attr", "aria-checked", "true");
            cy.get(`[data-test=toggle-money_collector]`).should("be.disabled")
        });
        cy.reload();
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=toggle-leader]`).should("have.attr", "aria-checked", "true");
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=toggle-equipment]`).should("have.attr", "aria-checked", "false");
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=toggle-equipment]`).should("have.attr", "aria-checked", "true");
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=toggle-money_collector]`).should("have.attr", "aria-checked", "false");
        cy.get(`[data-test=member-${signups[3].user.id}] [data-test=toggle-money_collector]`).should("have.attr", "aria-checked", "true");
        cy.get(`[data-test=member-${signups[3].user.id}] [data-test=toggle-money_collector_notified]`).should("have.attr", "aria-checked", "true");
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
