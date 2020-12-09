import {
  onConflictVenue,
  CreateVenues,
  CreateGig,
  DeleteSignup,
  SignupDetails,
  AddInstrument,
  RemoveInstruments,
  InstrumentsOnGig,
} from "../../database/gigs";
import { CreateUser, HASHED_PASSWORDS } from "../../database/users";

const click = $el => $el.click(); // For retrying clicks, see https://www.cypress.io/blog/2019/01/22/when-can-the-test-click/

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

let colors = {};

describe("gig signup", () => {
  before(() => {
    cy.visit("/");
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
    cy.cssProperty("--positive").then(positive_ => (colors.positive = positive_));
    cy.cssProperty("--negative").then(negative_ => (colors.negative = negative_));
    cy.cssProperty("--neutral").then(neutral_ => (colors.neutral = neutral_));
  });

  beforeEach(() => {
    cy.clock(Cypress.moment("2020-07-07 02:00").valueOf());
    cy.login("cypress_user", "abc123");
  });

  it("allows a user to sign up to a gig", () => {
    cy.visit("/members");
    cy.get(`[data-test="gig-15274-signup-yes"]`).should("not.have.color", colors.positive);
    cy.get(`[data-test="gig-15274-signup-yes"]`)
      .pipe(click)
      .should("have.color", colors.positive);

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

    cy.get(`[data-test="gig-15274-signup-maybe"]`).should("not.have.color", colors.netural);
    cy.get(`[data-test="gig-15274-signup-maybe"]`)
      .click()
      .should("have.color", colors.neutral);

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

    cy.get(`[data-test="gig-15274-signup-no"]`).should("not.have.color", colors.negative);
    cy.get(`[data-test="gig-15274-signup-no"]`)
      .click()
      .should("have.color", colors.negative);

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
      cy.intercept("POST", "/v1/graphql", {
        fixture: "gig/signup/yes.json",
      }).as("signup");

      cy.get(`[data-test="gig-15274-signup-yes"]`)
        .pipe(click)
        .should("have.color", colors.positive);

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
      cy.intercept({
        method: "POST",
        url: "/v1/graphql",
      }).as("graphqlRequest");

      cy.executeQuery(InstrumentsOnGig, {
        variables: {
          userId: 27250,
          gigId: 15274,
        },
      })
        .its("cucb_gigs_lineups_instruments_aggregate.aggregate.count")
        .should("equal", 0);

      cy.get(`[data-test="gig-15274-signup-yes"]`)
        .pipe(click)
        .should("have.color", colors.positive);

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

let gigForSummary = {
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

describe("gig summary", () => {
  let gig = gigForSummary;
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
      cy.contains(`Eigenharp`).hasTooltip("Cluck cluck");

      cy.log("Shows who's leading");
      cy.get("[data-test='is-leading']").hasTooltip("Leady is leading");
    });

    it("doesn't show financial information or admin notes", () => {
      cy.contains("deposit").should("not.exist");
      cy.contains("payment").should("not.exist");
    });

    it("shows a signup button", () => {
      cy.get(`[data-test='show-signup-${gig.id}']`).should("be.visible");
    });
  });

  context("logged in as admin before gig", () => {
    before(() => {
      cy.clock(Cypress.moment("2020-07-01 02:00").valueOf());
      cy.login("cypress", "abc123");
      cy.visit(`/members/gigs/${gig.id}`);
    });

    it("doesn't show post gig financial details", () => {
      cy.cssProperty("--positive").then(positive => {
        cy.cssProperty("--negative").then(negative => {
          cy.contains("Deposit received")
            .should("be.visible")
            .and("have.css", "color", positive);
          cy.contains("Payment").should("not.exist");
          cy.contains("Caller").should("not.exist");
        });
      });
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
});

describe("gig diary", () => {
  let signupGig = {
    ...gigForSummary,
    date: Cypress.moment()
      .add(1, "month")
      .format("YYYY-MM-DD"),
    time: Cypress.moment()
      .hour(19)
      .minute(30)
      .format("HH:MM"),
    arriveTime: Cypress.moment()
      .add(1, "month")
      .hour(18)
      .minute(30)
      .format(),
    finishTime: Cypress.moment()
      .add(1, "month")
      .hour(22)
      .minute(0)
      .format(),
  };

  let nonSignupGig = {
    ...gigForSummary,
    id: 34743274,
    allowSignups: false,
    date: Cypress.moment()
      .add(60, "days")
      .format("YYYY-MM-DD"),
    time: Cypress.moment()
      .hour(19)
      .minute(0)
      .format("HH:MM"),
    arriveTime: Cypress.moment()
      .add(60, "days")
      .hour(18)
      .minute(0)
      .format(),
    finishTime: Cypress.moment()
      .add(60, "days")
      .hour(21)
      .minute(15)
      .format(),
  };

  let pastGig = {
    ...gigForSummary,
    id: 33274,
    allowSignups: false,
    date: Cypress.moment()
      .add(-2, "month")
      .format("YYYY-MM-DD"),
    time: Cypress.moment()
      .hour(19)
      .minute(30)
      .format("HH:MM"),
    arriveTime: Cypress.moment()
      .add(-2, "month")
      .hour(18)
      .minute(30)
      .format(),
    finishTime: Cypress.moment()
      .add(-2, "month")
      .hour(22)
      .minute(0)
      .format(),
  };

  before(() => {
    cy.visit("/");
    cy.executeMutation(CreateGig, { variables: signupGig });
    cy.executeMutation(CreateGig, { variables: nonSignupGig });
    cy.executeMutation(CreateGig, { variables: pastGig });
    cy.executeMutation(DeleteSignup, { variables: { gigId: nonSignupGig.id, userId: 27250 } });
    cy.executeMutation(DeleteSignup, { variables: { gigId: signupGig.id, userId: 27250 } });
    cy.cssProperty("--positive").then(positive => (colors.positive = positive));
    cy.cssProperty("--neutral").then(neutral => (colors.neutral = neutral));
    cy.cssProperty("--negative").then(negative => (colors.negative = negative));
    cy.cssProperty("--unselected").then(unselected => (colors.unselected = unselected));
  });

  context("not logged in", () => {
    it("isn't accessible", () => {
      cy.request({ url: `/members/gigs`, failOnStatusCode: false })
        .its("status")
        .should("eq", 401);
    });
  });

  context("logged in as normal user", () => {
    beforeEach(() => {
      cy.clock(Cypress.moment("2020-07-07 02:00").valueOf());
      cy.login("cypress_user", "abc123");
    });

    it("shows upcoming gigs and signup if appropriate", () => {
      cy.visit(`/members/gigs`);
      cy.get(`[data-test=gig-summary-${signupGig.id}]`).should("be.visible");
      cy.get(`[data-test=show-signup-${signupGig.id}]`).should("be.visible");
      cy.get(`[data-test=gig-summary-${nonSignupGig.id}]`).should("be.visible");
      cy.get(`[data-test=show-signup-${nonSignupGig.id}]`).should("not.exist");
    });

    describe("signups", () => {
      beforeEach(() => {
        cy.executeMutation(DeleteSignup, { variables: { userId: 27250, gigId: signupGig.id } });
        cy.visit("/members/gigs");
      });

      it("allows a user to sign up to a gig and change their signup status", () => {
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .pipe(click)
          .should($el => {
            expect($el).to.not.be.visible;
          });
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.unselected);
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).should("have.color", colors.unselected);
        cy.get(`[data-test=gig-${signupGig.id}-signup-no]`).should("have.color", colors.unselected);
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-edit]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-instrument-20-toggle]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-save]`).click();
        cy.executeQuery(SignupDetails, {
          variables: {
            userId: 27250,
            gigId: signupGig.id,
          },
        })
          .its("cucb_gigs_lineups_by_pk")
          .should("include", {
            user_available: true,
            user_only_if_necessary: false,
          });
        cy.log("Successfully signed up to gig");

        cy.get(`[data-test=show-summary-${signupGig.id}]`).click();
        cy.get(`[data-test=show-signup-${signupGig.id}]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).should("have.color", colors.unselected);
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).should("have.color", colors.neutral);

        cy.executeQuery(SignupDetails, {
          variables: {
            userId: 27250,
            gigId: signupGig.id,
          },
        })
          .its("cucb_gigs_lineups_by_pk")
          .should("include", {
            user_available: true,
            user_only_if_necessary: true,
          })
          .its("user_instruments")
          .should("have.length", 1);
      });

      it("retains signup information on refresh", () => {
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .pipe(click)
          .should($el => {
            expect($el).to.not.be.visible;
          });
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.unselected);
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-${signupGig.id}-signup-edit]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-instrument-20-toggle]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-save]`).click();

        cy.visit("/members/gigs");
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .pipe(click)
          .should($el => {
            expect($el).to.not.be.visible;
          });
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-signup-${signupGig.id}]`).contains("Wind Synth");
        cy.get(`[data-test=gig-${signupGig.id}-signup-no]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-no]`).should("have.color", colors.negative);

        cy.visit("/members/gigs");
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .pipe(click)
          .should($el => {
            expect($el).to.not.be.visible;
          });
        cy.get(`[data-test=gig-${signupGig.id}-signup-no]`).should("have.color", colors.negative);
      });

      it("retains signup information when gig is hidden and then redisplayed", () => {
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .pipe(click)
          .should($el => {
            expect($el).to.not.be.visible;
          });
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.unselected);
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-${signupGig.id}-signup-edit]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-instrument-20-toggle]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-save]`).click();
        cy.get(`[data-test=gig-signup-${signupGig.id}]`).contains("Wind Synth");

        cy.get(`[data-test=gigview-by-month]`).click();
        cy.get(`[data-test=gigcalendar-previous-month]`).click();
        cy.get(`[data-test=gigcalendar-next-month]`).click();
        cy.get(`[data-test=gigcalendar-next-month]`).click();

        cy.get(`[data-test=show-signup-${signupGig.id}]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-signup-${signupGig.id}]`).contains("Wind Synth");

        cy.visit("/members/gigs");
        cy.get(`[data-test=gigview-by-month]`)
          .pipe(click)
          .should("not.exist"); // Click it until link becomes text
        cy.get(`[data-test=gigcalendar-next-month]`).click();
        cy.get(`[data-test=show-signup-${signupGig.id}]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-signup-${signupGig.id}]`).contains("Wind Synth");

        cy.get(`[data-test=gig-${signupGig.id}-signup-edit]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-instrument-20-toggle]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-save]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).click();

        cy.get(`[data-test=gigcalendar-next-month]`)
          .pipe(click)
          .parent()
          .parent()
          .should(
            "contain",
            Cypress.moment()
              .add(2, "months")
              .format("MMMM"),
          );
        cy.get(`[data-test=gigview-all-upcoming]`)
          .pipe(click)
          .should("not.exist");
        cy.get(`[data-test=show-signup-${signupGig.id}]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).should("have.color", colors.neutral);
        cy.get(`[data-test=gig-signup-${signupGig.id}]`).contains("No instruments selected");
      });

      it("can switch between upcoming and past gigs", () => {
        cy.get(`[data-test=gig-summary-${pastGig.id}]`).should("not.exist");
        cy.get(`[data-test=gigview-by-month]`)
          .pipe(click)
          .should("not.exist");
        cy.intercept({ method: "POST", url: "/v1/graphql" }).as("fetchGigs");
        cy.get(`[data-test=gigcalendar-previous-month]`).click();
        cy.wait("@fetchGigs");
        cy.get(`[data-test=gigcalendar-previous-month]`).click();
        cy.wait("@fetchGigs");
        cy.get(`[data-test=gig-summary-${pastGig.id}]`).should("be.visible");
        cy.get(`[data-test=gigcalendar-previous-month]`).click();
        cy.wait("@fetchGigs");
        cy.contains(
          Cypress.moment()
            .subtract(3, "months")
            .format("MMMM YYYY"),
        ).should("exist");
        cy.get(`[data-test=gig-summary-${pastGig.id}]`).should("not.exist");
        cy.get(`[data-test=gigview-all-upcoming]`)
          .pipe(click)
          .should("not.exist");
        cy.get(`[data-test=gig-summary-${signupGig.id}]`).should("be.visible");
      });
    });
  });
});

let venues = [1, 2, 3, 4, 5].map(n => ({
  address: "3 Trumpington St, Cambridge",
  postcode: "CB2 1QY",
  distance_miles: 0,
  longitude: 0.1182611,
  latitude: 52.2014254,
  map_link:
    "https://www.google.com/maps/place/Emmanuel+United+Reformed+Church/@52.2014254,0.1182611,15z/data=!4m5!3m4!1s0x0:0x4386e0813db16b3e!8m2!3d52.2014254!4d0.1182611",
  name: `A really long venue name to search for ${n.toString().repeat(n)}`,
  notes_band: null,
  subvenue: null,
  id: 3277457 * n,
}));

describe.only("gig editor", () => {
  before(() => {
    cy.executeMutation(CreateVenues, { variables: { venues, on_conflict: onConflictVenue } });
  });
  beforeEach(() => {
    cy.login("cypress", "abc123");
    cy.visit(`/members/gigs/${gigForSummary.id}/edit`);
  });

  it("detects unsaved changes", () => {
    cy.get(`[data-test=gig-edit-${gigForSummary.id}-title]`)
      .click()
      .type("modified title");
    cy.contains("unsaved changes").should("be.visible");
    cy.get(`[data-test=gig-edit-${gigForSummary.id}-title]`)
      .clear()
      .type(gigForSummary.title);
    cy.contains("unsaved changes").should("not.exist");
  });

  it("allows the user to search venues with the keyboard", () => {
    cy.get(`[data-test=gig-edit-${gigForSummary.id}-venue-search]`)
      .click()
      .type("A really long vneue to search for 333") // Deliberately misspelled to test fuzzy search
      .type("{downarrow}");
    cy.get(`[data-test=gig-edit-${gigForSummary.id}-venue-search-result]`)
      .contains("333")
      .should("have.focus")
      .type(" ");
    cy.get(`[data-test=select-box]`)
      .contains("333") // Find the correct select box (an <option>)
      .parent() // Parent of <option> -> <select>
      .should("have.value", venues[2].id)
      .should("have.focus");
    cy.get(`[data-test=gig-edit-${gigForSummary.id}-venue-search]`)
      .should("be.empty")
      .click()
      .type("A really long vneue to search for") // Deliberately misspelled to test fuzzy search
      .type("{downarrow}{downarrow}");
    cy.get(`[data-test=gig-edit-${gigForSummary.id}-venue-search-result]`)
      .should("have.focus")
      .contains("22")
      .type("{uparrow}{uparrow}{uparrow}");
    cy.get(`[data-test=gig-edit-${gigForSummary.id}-venue-search]`).should("have.focus");
  });
});
