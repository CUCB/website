import {
  CreateGig,
  DeleteSignup,
  SignupDetails,
  AddInstrument,
  RemoveInstruments,
  InstrumentsOnGig,
} from "../../database/gigs";
import { CreateUser, HASHED_PASSWORDS } from "../../database/users";

describe("lineup editor", () => {
  before(() => {
    cy.executeMutation(CreateGig, {
      variables: {
        id: 15274,
        title: "Cypress Demo Gig",
        type: 1,
        adminsOnly: false,
        allowSignups: false,
      },
    });
    cy.executeMutation(CreateUser, {
      variables: {
        id: 32747,
        username: "cypress",
        saltedPassword: HASHED_PASSWORDS.abc123,
        admin: 1,
        email: "cy@press.io",
        firstName: "Cypress",
        lastName: "Webmaster",
      },
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
  });

  context("authorized as webmaster", () => {
    beforeEach(() => cy.login("cypress", "abc123"));

    //it("has the correct gig title on the page", () => {
    // cy.visit("/members/gigs/15274/lineup-editor");
    // cy.contains("h2", "Cypress Demo Gig", { timeout: 200 });
    //});

    it("gives a 404 error when the gig doesn't exist", () => {
      cy.request({
        url: "/members/gigs/15275/lineup-editor",
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 404);
    });
  });

  context("not logged in", () => {
    it("isn't accessible", () => {
      cy.request({
        url: "/members/gigs/15274/lineup-editor",
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 401);
    });

    it("shows not logged in error on non existent gig", () => {
      cy.request({
        url: "/members/gigs/15275/lineup-editor",
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
        url: "/members/gigs/15274/lineup-editor",
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 403);
    });
  });
});

describe("gig signup", () => {
  before(() => {
    cy.server();
    cy.executeMutation(CreateGig, {
      variables: {
        id: 15274,
        title: "Cypress Demo Gig",
        type: 1,
        adminsOnly: false,
        allowSignups: true,
        date: "2020-07-17",
      },
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
    cy.executeMutation(DeleteSignup, {
      variables: {
        userId: 27250,
        gigId: 15274,
      },
    });
  });

  beforeEach(() => {
    cy.clock(Cypress.moment("2020-07-07 02:00").valueOf());
    cy.login("cypress_user", "abc123");
  });

  it("allows a user to sign up to a gig", () => {
    cy.visit("/members");

    cy.wait(100);

    cy.cssProperty("--positive").then(positive => {
      cy.get(`[data-test="gig-15274-signup-yes"]`)
        .should("have.css", "color")
        .and("not.equal", positive);
      cy.get(`[data-test="gig-15274-signup-yes"]`)
        .click()
        .should("have.css", "color")
        .and("equal", positive);
    });

    cy.executeQuery(SignupDetails, {
      variables: {
        userId: 27250,
        gigId: 15274,
      },
    })
      .its("cucb_gigs_lineups_by_pk")
      .should("include", {
        user_available: true,
        user_only_if_necessary: false,
      });

    cy.cssProperty("--neutral").then(neutral => {
      cy.get(`[data-test="gig-15274-signup-maybe"]`)
        .should("have.css", "color")
        .and("not.equal", neutral);
      cy.get(`[data-test="gig-15274-signup-maybe"]`)
        .click()
        .should("have.css", "color")
        .and("equal", neutral);
    });

    cy.executeQuery(SignupDetails, {
      variables: {
        userId: 27250,
        gigId: 15274,
      },
    })
      .its("cucb_gigs_lineups_by_pk")
      .then(res => {
        cy.log("Checking user available");
        expect(res.user_available).to.equal(true);
        cy.log("Checking user if necessary");
        expect(res.user_only_if_necessary).to.equal(true);
      });

    cy.executeQuery(SignupDetails, {
      variables: {
        userId: 27250,
        gigId: 15274,
      },
    })
      .its("cucb_gigs_lineups_by_pk")
      .should("include", {
        user_available: true,
        user_only_if_necessary: true,
      });

    cy.cssProperty("--negative").then(negative => {
      cy.get(`[data-test="gig-15274-signup-no"]`)
        .should("have.css", "color")
        .and("not.equal", negative);
      cy.get(`[data-test="gig-15274-signup-no"]`)
        .click()
        .should("have.css", "color")
        .and("equal", negative);
    });

    cy.executeQuery(SignupDetails, {
      variables: {
        userId: 27250,
        gigId: 15274,
      },
    })
      .its("cucb_gigs_lineups_by_pk")
      .should("include", {
        user_available: false,
      });
  });

  context("without_instruments", () => {
    before(() => {
      cy.executeMutation(RemoveInstruments, {
        variables: {
          userId: 27250,
        },
      });
      cy.login("cypress_user", "abc123");
      cy.visit("/members");
    });

    it("links to user profile when editing instruments", () => {
      cy.route2("POST", "/v1/graphql", {
        fixture: "gig/signup/yes.json",
      }).as("signup");

      cy.wait(100);

      cy.get(`[data-test="gig-15274-signup-yes"]`).click();

      cy.wait("@signup");

      cy.get(`[data-test="gig-15274-signup-edit"]`).click();

      cy.get(`a[href="/members/user"]`).should("exist");
    });
  });

  context("with instruments", () => {
    before(() => {
      cy.executeMutation(AddInstrument, {
        variables: {
          userId: 27250,
          instrumentId: 53,
        },
      });
      cy.executeMutation(AddInstrument, {
        variables: {
          userId: 27250,
          instrumentId: 20,
        },
      });
      cy.login("cypress_user", "abc123");
      cy.visit("/members");
    });

    it("allows adding and editing of instruments", () => {
      cy.route2({
        method: "POST",
        url: "/v1/graphql",
      }).as("graphqlRequest");

      cy.wait(100);

      cy.executeQuery(InstrumentsOnGig, {
        variables: {
          userId: 27250,
          gigId: 15274,
        },
      })
        .its("cucb_gigs_lineups_instruments_aggregate.aggregate.count")
        .should("equal", 0);

      cy.get(`[data-test="gig-15274-signup-yes"]`).click();

      cy.wait("@graphqlRequest");

      cy.get(`[data-test="gig-15274-signup-edit"]`).click();

      cy.get(`[data-test="gig-15274-signup-instrument-53-toggle"]`).click();

      cy.get(`[data-test="gig-15274-signup-save"]`).click();

      cy.wait("@graphqlRequest");

      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`)
        .contains("Trombone")
        .should("exist");

      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`)
        .contains("Wind Synth")
        .should("not.exist");

      cy.get(`[data-test="gig-15274-signup-edit"]`).click();

      cy.get(`[data-test="gig-15274-signup-instrument-20-toggle"]`).click();

      cy.get(`[data-test="gig-15274-signup-instrument-53-toggle"]`).click();

      cy.get(`[data-test="gig-15274-signup-save"]`).click();

      cy.wait("@graphqlRequest");

      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`)
        .contains("Trombone")
        .should("not.exist");

      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`)
        .contains("Wind Synth")
        .should("exist");
    });
  });
});

describe("gig summary", () => {
  let onConflictUser = {
    constraint: "cucb_users_id_key",
    update_columns: ["first", "last", "email"],
  };

  let onConflictUserInstrument = {
    constraint: "cucb_users_instruments_id_key",
    update_columns: ["nickname", "instr_id", "deleted"],
  };

  let onConflictLineupUserInstrument = {
    constraint: "gigs_lineups_instruments_pkey",
    update_columns: ["approved"],
  };

  let onConflictVenue = {
    constraint: "cucb_gig_venues_id_key",
    update_columns: [
      "address",
      "distance_miles",
      "latitude",
      "longitude",
      "map_link",
      "name",
      "notes_admin",
      "notes_band",
      "postcode",
      "subvenue",
    ],
  };

  let gig = {
    id: 74527,
    title: "Gig of excitement",
    adminsOnly: false,
    allowSignups: true,
    date: "2020-07-25",
    time: "21:00",
    arriveTime: "2020-07-25T20:00+01:00",
    finishTime: "2020-07-25T23:00+01:00",
    depositReceived: true,
    paymentReceived: false,
    venue: {
      on_conflict: onConflictVenue,
      data: {
        address: "3 Trumpington St, Cambridge",
        postcode: "CB2 1QY",
        distance_miles: 0,
        longitude: 0.1182611,
        latitude: 52.2014254,
        map_link:
          "https://www.google.com/maps/place/Emmanuel+United+Reformed+Church/@52.2014254,0.1182611,15z/data=!4m5!3m4!1s0x0:0x4386e0813db16b3e!8m2!3d52.2014254!4d0.1182611",
        name: "Emmanuel United Reform Church",
        notes_band: "Where we (used to) rehearse",
        subvenue: null,
        id: 3277452,
      },
    },
    lineup: {
      on_conflict: {
        constraint: "gigs_lineups_pkey",
        update_columns: ["approved", "leader", "money_collector", "driver", "equipment", "user_id"],
      },
      data: [
        {
          approved: true,
          leader: true,
          equipment: false,
          money_collector: false,
          driver: false,
          user: {
            on_conflict: onConflictUser,
            data: {
              id: 374325,
              username: "leady374325",
              first: "Leady",
              last: "Lead",
              email: "user374325@testi.ng",
              user_instruments: {
                on_conflict: onConflictUserInstrument,
                data: [
                  {
                    id: 105747,
                    deleted: false,
                    instr_id: 20,
                    nickname: null,
                  },
                  {
                    id: 576743,
                    deleted: true,
                    instr_id: 63,
                    nickname: "Cluck cluck",
                  },
                ],
              },
            },
          },
          user_instruments: {
            on_conflict: onConflictLineupUserInstrument,
            data: [
              {
                user_instrument_id: 105747,
                approved: true,
              },
              {
                user_instrument_id: 576743,
                approved: true,
              },
            ],
          },
        },
        {
          approved: true,
          leader: false,
          equipment: true,
          driver: true,
          money_collector: true,
          user: {
            on_conflict: onConflictUser,
            data: {
              id: 567236,
              username: "User567236",
              first: "Twizzly",
              last: "Dialy",
              email: "user567236@testi.ng",
              user_instruments: {
                on_conflict: onConflictUserInstrument,
                data: [
                  {
                    deleted: false,
                    instr_id: 66,
                    nickname: null,
                  },
                ],
              },
            },
          },
        },
      ],
    },
  };
  before(() => {
    cy.executeMutation(CreateGig, { variables: gig });
  });

  context("not logged in", () => {
    it("isn't accessible", () => {
      cy.request({ url: `/members/gigs/${gig.id}`, failOnStatusCode: false })
        .its("status")
        .should("eq", 401);
    });
  });

  context("logged in as normal user", () => {
    before(() => {
      cy.clock(Cypress.moment("2020-07-07 02:00").valueOf());
      cy.login("cypress_user", "abc123");
      cy.visit(`/members/gigs/${gig.id}`);
    });

    it("shows the dates and times in the correct timezone", () => {
      cy.contains(`Start time: 21:00`);
      cy.contains(`Arrive time: 20:00`);
      cy.contains(`Finish time: 23:00`);
      cy.contains(`Saturday 25th July 2020`);
    });

    it("shows lineup information", () => {
      cy.log("Shows names");
      cy.contains(`Leady Lead`).should("be.visible");
      cy.contains(`Twizzly Dialy`).should("be.visible");

      cy.log("Shows instrument with nickname on hover");
      cy.get("[data-test='tooltip']").should("not.exist");
      cy.contains(`Eigenharp`).hasTooltip("Cluck cluck");

      cy.log("Shows who's leading");
      cy.get("[data-test='is-leading']").trigger("mouseenter");
      cy.get("[data-test='tooltip']").contains("Leady is leading");
      cy.get("[data-test='is-leading']").trigger("mouseleave");
    });

    it("doesn't show financial information or admin notes", () => {
      cy.contains("deposit").should("not.exist");
      cy.contains("payment").should("not.exist");
    });

    it("shows a signup button", () => {
      cy.get("[data-test='show-signup']").should("be.visible");
    });
  });

  context("logged in as admin after gig", () => {
    before(() => {
      cy.clock(Cypress.moment("2020-07-30 02:00").valueOf());
      cy.login("cypress", "abc123");
      cy.visit(`/members/gigs/${gig.id}`);
    });

    it("shows accurate financial status", () => {
      cy.cssProperty("--positive").then(positive => {
        cy.cssProperty("--negative").then(negative => {
          cy.contains("Deposit received")
            .should("be.visible")
            .and("have.css", "color", positive);
          cy.contains("Payment not received")
            .should("be.visible")
            .and("have.css", "color", negative);
          cy.contains("Caller not paid")
            .should("be.visible")
            .and("have.css", "color", negative);
        });
      });
    });
  });

  context("logged in as admin before gig", () => {
    before(() => {
      cy.clock(Cypress.moment("2020-07-12 02:00").valueOf());
      cy.login("cypress", "abc123");
      cy.visit(`/members/gigs/${gig.id}`);
    });

    it("shows accurate financial status", () => {
      cy.cssProperty("--positive").then(positive => {
        cy.cssProperty("--negative").then(negative => {
          cy.contains("Deposit received")
            .should("be.visible")
            .and("have.css", "color", positive);
          cy.contains("Payment not received").should("not.exist");
          cy.contains("Caller not paid").should("not.exist");
        });
      });
    });
  });
});
