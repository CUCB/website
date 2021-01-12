import {
  onConflictVenue,
  CreateGig,
  DeleteSignup,
  SignupDetails,
  AddInstrument,
  RemoveInstruments,
  InstrumentsOnGig,
  SetResetGig,
  ClearLineupForGig,
} from "../../database/gigs";
import { CreateUser, HASHED_PASSWORDS } from "../../database/users";

const click = ($el) => $el.click(); // For retrying clicks, see https://www.cypress.io/blog/2019/01/22/when-can-the-test-click/

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
    cy.executeMutation(DeleteSignup, {
      variables: {
        userId: 27250,
        gigId: 15274,
      },
    });
    cy.cssProperty("--positive").then((positive_) => (colors.positive = positive_));
    cy.cssProperty("--negative").then((negative_) => (colors.negative = negative_));
    cy.cssProperty("--neutral").then((neutral_) => (colors.neutral = neutral_));
  });

  beforeEach(() => {
    cy.clock(Cypress.DateTime.fromISO("2020-07-07T02:00").valueOf());
    cy.login("cypress_user", "abc123");
  });

  it("allows a user to sign up to a gig", () => {
    cy.visit("/members");
    cy.get(`[data-test="gig-15274-signup-yes"]`).should("not.have.color", colors.positive);
    cy.get(`[data-test="gig-15274-signup-yes"]`).pipe(click).should("have.color", colors.positive);

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
    cy.get(`[data-test="gig-15274-signup-maybe"]`).click().should("have.color", colors.neutral);

    cy.executeQuery(SignupDetails, {
      variables: {
        userId: 27250,
        gigId: 15274,
      },
    })
      .its("cucb_gigs_lineups_by_pk")
      .then((res) => {
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
    cy.get(`[data-test="gig-15274-signup-no"]`).click().should("have.color", colors.negative);

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

      cy.get(`[data-test="gig-15274-signup-yes"]`).pipe(click).should("have.color", colors.positive);

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

      cy.get(`[data-test="gig-15274-signup-yes"]`).pipe(click).should("have.color", colors.positive);

      cy.wait("@graphqlRequest");

      cy.get(`[data-test="gig-15274-signup-edit"]`).click();

      cy.get(`[data-test="gig-15274-signup-instrument-53-toggle"]`).click();

      cy.get(`[data-test="gig-15274-signup-save"]`).click();

      cy.wait("@graphqlRequest");

      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`).contains("Trombone").should("exist");

      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`).contains("Wind Synth").should("not.exist");

      cy.get(`[data-test="gig-15274-signup-edit"]`).click();

      cy.get(`[data-test="gig-15274-signup-instrument-20-toggle"]`).click();

      cy.get(`[data-test="gig-15274-signup-instrument-53-toggle"]`).click();

      cy.get(`[data-test="gig-15274-signup-save"]`).click();

      cy.wait("@graphqlRequest");

      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`).contains("Trombone").should("not.exist");

      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`).contains("Wind Synth").should("exist");
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
  callerPaid: false,
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
    cy.executeMutation(ClearLineupForGig, { variables: { id: gig.id } });
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
      cy.clock(Cypress.DateTime.fromISO("2020-07-07T02:00").valueOf());
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
      cy.contains(`Eigenharp`).hasMouseTooltip("Cluck cluck");

      cy.log("Shows who's leading");
      cy.get("[data-test='is-leading']").hasMouseTooltip("Leady is leading");
    });

    it("doesn't show financial information or admin notes", () => {
      cy.contains("deposit").should("not.exist");
      cy.contains("payment").should("not.exist");
    });

    it("shows a signup button", () => {
      cy.get(`[data-test='show-signup-${gig.id}']`).should("be.visible");
    });

    it("does not show an edit button", () => {
      cy.get("a").contains("Edit gig").should("not.exist");
    });
  });

  context("logged in as admin before gig", () => {
    beforeEach(() => {
      cy.clock(Cypress.DateTime.fromISO("2020-07-01T02:00").valueOf());
      cy.login("cypress", "abc123");
      cy.visit(`/members/gigs/${gig.id}`);
    });

    it("doesn't show post gig financial details", () => {
      cy.cssProperty("--positive").then((positive) => {
        cy.cssProperty("--negative").then((negative) => {
          cy.contains("Deposit received").should("be.visible").and("have.css", "color", positive);
          cy.contains("Payment").should("not.exist");
          cy.contains("Caller").should("not.exist");
        });
      });
    });

    it("contains a working edit button", () => {
      cy.get("a").contains("Edit gig").clickLink();
      cy.get(`[data-test=gig-edit-${gig.id}-title]`).should("have.value", gig.title);
      cy.get(`[data-test=gig-edit-${gig.id}-date]`).should("have.value", gig.date);
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .should("have.value", gig.venue.data.id)
        .find(":selected")
        .invoke("html")
        .should("eq", gig.venue.data.name);
    });
  });

  context("logged in as admin after gig", () => {
    before(() => {
      cy.clock(Cypress.DateTime.fromISO("2020-07-30T02:00").valueOf());
      cy.login("cypress", "abc123");
      cy.visit(`/members/gigs/${gig.id}`);
    });

    it("shows accurate financial status", () => {
      cy.cssProperty("--positive").then((positive) => {
        cy.cssProperty("--negative").then((negative) => {
          cy.contains("Deposit received").should("be.visible").and("have.css", "color", positive);
          cy.contains("Payment not received").should("be.visible").and("have.css", "color", negative);
          cy.contains("Caller not paid").should("be.visible").and("have.css", "color", negative);
        });
      });
    });
  });
});

describe("gig diary", () => {
  let signupGig = {
    ...gigForSummary,
    date: Cypress.DateTime.local().plus({ months: 1 }).toFormat("yyyy-LL-dd"),
    time: Cypress.DateTime.local().set({ hour: 19, minute: 30 }).toFormat("HH:mm"),
    arriveTime: Cypress.DateTime.local().plus({ months: 1 }).set({ hour: 18, minute: 30 }).toISO(),
    finishTime: Cypress.DateTime.local().plus({ months: 1 }).set({ hour: 22, minute: 0 }).toISO(),
  };

  let nonSignupGig = {
    ...gigForSummary,
    id: 34743274,
    allowSignups: false,
    date: Cypress.DateTime.local().plus({ days: 60 }).toFormat("yyyy-LL-dd"),
    time: Cypress.DateTime.local().set({ hour: 19, minute: 0 }).toFormat("HH:mm"),
    arriveTime: Cypress.DateTime.local().plus({ days: 60 }).set({ hour: 18, minute: 0 }).toISO(),
    finishTime: Cypress.DateTime.local().plus({ days: 60 }).set({ hour: 21, minute: 15 }).toISO(),
  };

  let pastGig = {
    ...gigForSummary,
    id: 33274,
    allowSignups: false,
    date: Cypress.DateTime.local().plus({ months: -2 }).toFormat("yyyy-LL-dd"),
    time: Cypress.DateTime.local().set({ hour: 19, minute: 30 }).toFormat("HH:mm"),
    arriveTime: Cypress.DateTime.local().plus({ months: -2 }).set({ hour: 18, minute: 30 }).toISO(),
    finishTime: Cypress.DateTime.local().plus({ months: -2 }).set({ hour: 22, minute: 0 }).toISO(),
  };

  before(() => {
    cy.visit("/");
    cy.executeMutation(CreateGig, { variables: signupGig });
    cy.executeMutation(CreateGig, { variables: nonSignupGig });
    cy.executeMutation(CreateGig, { variables: pastGig });
    cy.executeMutation(DeleteSignup, { variables: { gigId: nonSignupGig.id, userId: 27250 } });
    cy.executeMutation(DeleteSignup, { variables: { gigId: signupGig.id, userId: 27250 } });
    cy.cssProperty("--positive").then((positive) => (colors.positive = positive));
    cy.cssProperty("--neutral").then((neutral) => (colors.neutral = neutral));
    cy.cssProperty("--negative").then((negative) => (colors.negative = negative));
    cy.cssProperty("--unselected").then((unselected) => (colors.unselected = unselected));
  });

  context("not logged in", () => {
    it("isn't accessible", () => {
      cy.request({ url: `/members/gigs`, failOnStatusCode: false }).its("status").should("eq", 401);
    });
  });

  context("logged in as normal user", () => {
    beforeEach(() => {
      cy.clock(Cypress.DateTime.fromISO("2020-07-07 02:00").valueOf());
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
          .should(($el) => {
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
          .should(($el) => {
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
          .should(($el) => {
            expect($el).to.not.be.visible;
          });
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-signup-${signupGig.id}]`).contains("Wind Synth");
        cy.get(`[data-test=gig-${signupGig.id}-signup-no]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-no]`).should("have.color", colors.negative);

        cy.visit("/members/gigs");
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .pipe(click)
          .should(($el) => {
            expect($el).to.not.be.visible;
          });
        cy.get(`[data-test=gig-${signupGig.id}-signup-no]`).should("have.color", colors.negative);
      });

      it("retains signup information when gig is hidden and then redisplayed", () => {
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .pipe(click)
          .should(($el) => {
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
        cy.get(`[data-test=gigview-by-month]`).pipe(click).should("not.exist"); // Click it until link becomes text
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
          .should("contain", Cypress.DateTime.local().plus({ months: 2 }).toFormat("LLLL"));
        cy.get(`[data-test=gigview-all-upcoming]`).pipe(click).should("not.exist");
        cy.get(`[data-test=show-signup-${signupGig.id}]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).should("have.color", colors.neutral);
        cy.get(`[data-test=gig-signup-${signupGig.id}]`).contains("No instruments selected");
      });

      it("can switch between upcoming and past gigs", () => {
        cy.get(`[data-test=gig-summary-${pastGig.id}]`).should("not.exist");
        cy.get(`[data-test=gigview-by-month]`).pipe(click).should("not.exist");
        cy.intercept({ method: "POST", url: "/v1/graphql" }).as("fetchGigs");
        cy.get(`[data-test=gigcalendar-previous-month]`).click();
        cy.wait("@fetchGigs");
        cy.get(`[data-test=gigcalendar-previous-month]`).click();
        cy.wait("@fetchGigs");
        cy.get(`[data-test=gig-summary-${pastGig.id}]`).should("be.visible");
        cy.get(`[data-test=gigcalendar-previous-month]`).click();
        cy.wait("@fetchGigs");
        cy.contains(Cypress.DateTime.local().minus({ months: 3 }).toFormat("LLLL yyyy")).should("exist");
        cy.get(`[data-test=gig-summary-${pastGig.id}]`).should("not.exist");
        cy.get(`[data-test=gigview-all-upcoming]`).pipe(click).should("not.exist");
        cy.get(`[data-test=gig-summary-${signupGig.id}]`).should("be.visible");
      });
    });
  });
});

let venues = [1, 2, 3, 4, 5].map((n) => ({
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

let contacts = [
  {
    id: 3274354,
    user_id: 32747,
    name: "Cally Call",
    email: "caller@call.io",
    organization: null,
    notes: null,
    caller: true,
  },
  {
    id: 3274354 * 2,
    user_id: null,
    name: "A Client1",
    email: "client@gmail.com",
    organization: null,
    notes: null,
    caller: false,
  },
  {
    id: 3274354 * 3,
    user_id: null,
    name: "A Client2",
    email: "client@gmail.com",
    organization: null,
    notes: null,
    caller: false,
  },
  {
    id: 3274354 * 4,
    user_id: null,
    name: "A Client3",
    email: "client@gmail.com",
    organization: null,
    notes: null,
    caller: false,
  },
];

describe("gig editor", () => {
  let gig = gigForSummary;
  before(() => {
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
  });

  context("saving changes", () => {
    beforeEach(() => {
      cy.executeMutation(SetResetGig, {
        variables: {
          ...gig,
          where_delete_contacts: { _or: [{ name: { _like: "A Client%" } }, { name: { _like: "A Caller%" } }] },
          where_delete_venues: { name: { _like: "%og on%" } },
          create_contacts: contacts,
          create_venues: venues,
        },
      });
      cy.login("cypress", "abc123");
      cy.visit(`/members/gigs/${gig.id}/edit`);
    });

    it("detects unsaved changes", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-title]`).click().type("modified title", { delay: 0 });
      cy.contains("unsaved changes").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-title]`).clear().type(gig.title, { delay: 0 });
      cy.contains("unsaved changes").should("not.exist");
    });

    it("allows the user to search venues with the keyboard", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search]`)
        .click()
        .type("really long vneue to search for 333", { delay: 0 }) // Deliberately misspelled to test fuzzy search
        .type("{downarrow}");
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search-result]`).contains("333").should("have.focus").type(" ");
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .should("have.value", venues[2].id)
        .should("have.focus");
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search]`)
        .should("be.empty")
        .click()
        .type("A really long vneue to search for", { delay: 0 }) // Deliberately misspelled to test fuzzy search
        .type("{downarrow}{downarrow}");
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search-result]`)
        .contains("22")
        .should("have.focus")
        .type("{uparrow}{uparrow}{uparrow}");
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search]`).should("have.focus");
    });

    it("can update gig details", () => {
      let newDate = Cypress.DateTime.local().plus({ weeks: 7 });
      cy.get(`[data-test=gig-edit-${gig.id}-title]`)
        .click()
        .clear()
        .type("Replaced title", { delay: 0 })
        .clear()
        .type("Replaced title", { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-date]`).click().type(newDate.toFormat("yyyy-LL-dd"), { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-date]`)
        .click()
        .type(newDate.toFormat("yyyy-LL-dd"), { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-date]`)
        .click()
        .type(newDate.toFormat("yyyy-LL-dd"), { delay: 0 });

      cy.get(`[data-test=gig-edit-${gig.id}-notes-band]`)
        .click()
        .clear()
        .type("        ", { delay: 0 })
        .log("should trim that field");
      cy.get(`[data-test=gig-edit-${gig.id}-advertise]`).check();
      cy.get(`[data-test=gig-edit-${gig.id}-finance-deposit]`).uncheck();
      cy.get(`[data-test=gig-edit-${gig.id}-finance]`).click().type("Deposit: some amount", { delay: 0 });

      cy.contains("unsaved changes").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.contains("unsaved changes").should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-notes-admin]`).click().clear().type("Setting admin notes", { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-summary]`).click().clear().type("Some sort of summary", { delay: 0 });

      cy.contains("unsaved changes").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-summary]`).type("{alt}s").log("can save with alt+s");
      cy.contains("unsaved changes").should("not.exist");
      cy.get("h2").should("contain", "Replaced title").and("not.contain", gig.title);
      cy.visit(`/members/gigs/${gig.id}`);
      cy.contains("Replaced title").should("be.visible");
      cy.contains("Some sort of summary").should("be.visible");
      cy.contains("Admin notes").should("be.visible");
      cy.contains("Setting admin notes").should("be.visible");
      cy.contains("Band notes").should("not.exist");
      cy.contains("Deposit not received").should("be.visible");
      cy.contains("Public advert").should("be.visible");
      cy.contains("Deposit: some amount").should("be.visible");
    });

    it("can add clients and callers", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).invoke("val").should("be.null");
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).invoke("val").should("be.null");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`).contains(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-callers-${contacts[0].id}-remove]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).should("not.contain", contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`).contains(contacts[0].name);

      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-clients-${contacts[0].id}-remove]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains(contacts[0].name);
    });

    it("sorts contacts when adding them to a gig", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[2].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[1].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[3].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`)
        .contains(contacts[3].name)
        .log("Wait for the last name to appear");
      // verify the names are indeed in sorted order
      const toStrings = (cells$) => Cypress._.map(cells$, "textContent");
      cy.get(`[data-test=gig-edit-${gig.id}-client-list] [data-test=contact-name]`)
        .then(toStrings)
        .then((names) => {
          expect(names[0]).to.equal(contacts[1].name);
          expect(names[1]).to.equal(contacts[2].name);
          expect(names[2]).to.equal(contacts[3].name);
        });

      cy.reload();

      cy.get(`[data-test=gig-edit-${gig.id}-client-list] [data-test=contact-name]`)
        .then(toStrings)
        .then((names) => {
          expect(names[0]).to.equal(contacts[1].name);
          expect(names[1]).to.equal(contacts[2].name);
          expect(names[2]).to.equal(contacts[3].name);
        });
    });

    it("can edit existing clients and callers", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[1].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-clients-${contacts[1].id}-edit]`).click();
      cy.get(`[data-test=contact-editor-organization]`).click().clear().type("Some org", { delay: 0 });
      cy.get(`[data-test=contact-editor-name]`).click().clear().type("A ClientN", { delay: 0 });
      cy.get(`[data-test=contact-editor-save]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`).contains("A ClientN @ Some org");
      cy.get(`[data-test=gig-edit-${gig.id}-client-select]`).contains("A Client1").should("not.exist");
      cy.reload();
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`).contains("A ClientN @ Some org");
      cy.get(`[data-test=gig-edit-${gig.id}-client-select]`).contains("A Client1").should("not.exist");
    });

    it("can create new contacts and add them to gigs", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`, { log: false }).select(
        contacts[1].name,
        { log: false },
      ); // Wait for buttons to have event handlers sorted
      cy.log("Waited for page to be ready");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-new]`).click();
      cy.get(`[data-test=contact-editor-caller]`).should("be.checked");
      cy.get(`[data-test=contact-editor-name]`).type("A Caller", { delay: 0 });
      cy.get(`[data-test=contact-editor-email]`).type("a.caller@ceili.dh", { delay: 0 });
      cy.get(`[data-test=contact-editor-save]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`)
        .find(":selected")
        .contains("A Caller");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains("A Caller", { delay: 0 });
      cy.reload();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains("A Caller", { delay: 0 });
    });

    it("can create a new venue", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`, { log: false }).select(
        contacts[1].name,
        { log: false },
      ); // Wait for buttons to have event handlers sorted
      cy.log("Waited for page to be ready");
      cy.get(`[data-test=gig-edit-${gig.id}-create-venue]`).click();
      cy.get(`[data-test=venue-editor-name]`).click().type("Mog on the Tyne", { delay: 0 });
      cy.get(`[data-test=venue-editor-map-link]`).paste(
        "https://www.google.com/maps/place/Mog+on+the+Tyne/@54.9706584,-1.6163193,0.25z",
      );
      cy.get(`[data-test=venue-editor-latitude]`).should("have.value", "54.9706584");
      cy.get(`[data-test=venue-editor-longitude]`).should("have.value", "-1.6163193");
      cy.get(`[data-test=venue-editor-notes-band]`).click().type("Notey notey note", { delay: 0 });
      cy.get(`[data-test=venue-editor-save]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .should("have.focus")
        .find(":selected")
        .contains("Mog on the Tyne");

      cy.get(`[data-test=gig-edit-${gig.id}-create-venue]`).click();
      cy.get(`[data-test=venue-editor-name]`).click().type("Cog on the Line", { delay: 0 });
      cy.get(`[data-test=venue-editor-save]`).click();

      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .find(":contains('og on')")
        .then((elements) => {
          let venues = Cypress.$.map(elements, (e) => e.innerHTML);
          expect(venues).to.have.length(2).and.be.ascending;
        });

      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`).select("Mog on the Tyne");
      cy.get(`[data-test=gig-edit-${gig.id}-edit-venue]`).click();
      cy.get(`[data-test=venue-editor-name]`).should("have.value", "Mog on the Tyne");
      cy.get(`[data-test=venue-editor-notes-band]`).should("have.value", "Notey notey note");
      cy.get(`[data-test=venue-editor-subvenue]`).type("Prrrrs", { delay: 0 });
      cy.get(`[data-test=venue-editor-cancel]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .should("have.focus")
        .find(":selected")
        .should("contain", "Mog on the Tyne")
        .and("not.contain", "Prrr");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.reload();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .find(":selected")
        .should("contain", "Mog on the Tyne")
        .and("not.contain", "Prrr");
    });

    it("can search for a newly created venue", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`, { log: false }).select(
        contacts[1].name,
        { log: false },
      ); // Wait for buttons to have event handlers sorted
      cy.log("Waited for page to be ready");
      cy.get(`[data-test=gig-edit-${gig.id}-create-venue]`).click();
      cy.get(`[data-test=venue-editor-name]`).click().type("Sog on the Pine", { delay: 0 });
      cy.get(`[data-test=venue-editor-subvenue]`).click().type("A subvenue", { delay: 0 });
      cy.get(`[data-test=venue-editor-save]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`).select(venues[2].name);
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search]`).click().type("Sog on the", { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search-result]`).contains("Sog on the Pine", { delay: 0 }).click();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .find(":selected")
        .contains("Sog on the Pine")
        .contains("A subvenue");
      cy.get(`[data-test=gig-edit-${gig.id}-edit-venue]`).click();
      cy.get(`[data-test=venue-editor-subvenue]`).click().clear().type("A different subvenue", { delay: 0 });
      cy.get(`[data-test=venue-editor-save]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.visit(`/members/gigs/${gig.id}`);
      cy.get("*").should("contain", "Sog on the Pine").and("contain", "A different subvenue");
    });

    it("rejects invalid dates with custom error messages", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-time]`).click().type("19:13");
      cy.get(`[data-test=gig-edit-${gig.id}-time]`).click().type("20:26");
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-time]`).click().type("18:00");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.contains("unsaved changes").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-time]`).then(($input) => {
        cy.log("Check field for custom error");
        expect($input[0].validationMessage).to.match(/[Ff]inish time/);
        expect($input[0].validationMessage).to.match(/[Ar]ive time/);
      });
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-time]`).click().type("22:00");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.contains("unsaved changes").should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-time]`).click().type("00:00");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-time]`).then(($input) => {
        cy.log("Check field for custom error");
        expect($input[0].validationMessage).to.match(/[Ff]inish time/);
        expect($input[0].validationMessage).to.match(/[Ss]tart time/);
      });
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-time]`).then(($input) => {
        cy.log("Check field for custom error");
        expect($input[0].validationMessage).to.match(/[Ar]ive time/);
      });
      cy.visit(`/members/gigs/${gig.id}`);
      cy.contains("Arrive time: 19:13").should("be.visible");
      cy.contains("Start time: 20:26").should("be.visible");
      cy.contains("Finish time: 22:00").should("be.visible");
    });

    it("warns when arrive time coincides with start time", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-time]`).click().type("19:00");
      cy.get(`[data-test=gig-edit-${gig.id}-time]`).click().type("19:00");
      cy.get(`[data-test=gig-edit-${gig.id}-timing-warnings]`)
        .children()
        .should("have.length", 1)
        .invoke("html")
        .should("match", /[Aa]rrive time/)
        .and("match", /[Ss]tart time/);
    });

    it("filters selected callers and clients from lists to add", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`)
        .contains(contacts[0].name)
        .should("not.exist");

      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[1].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`)
        .contains(contacts[1].name)
        .should("not.exist");
    });

    it("can search for clients and add them to a gig", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-search]`).click().type(contacts[1].name, { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-client-search-results]`).contains(contacts[1].name).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`)
        .find(":selected")
        .invoke("html")
        .should("eq", contacts[1].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-search]`).invoke("val").should("be.empty");
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`).contains(contacts[1].name).should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-client-search]`).click().type(contacts[1].name, { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-client-search-results]`).contains(contacts[1].name).should("not.exist");
    });

    it("can search for callers and add them to a gig", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search]`).click().type(contacts[0].name, { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search-results]`).contains(contacts[0].name).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`)
        .find(":selected")
        .invoke("html")
        .should("eq", contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search]`).invoke("val").should("be.empty");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains(contacts[0].name).should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search]`).click().type(contacts[0].name, { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search-results]`).contains(contacts[0].name).should("not.exist");
    });

    it("updates caller details in client list when edited", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-callers-${contacts[0].id}-edit]`).click();
      cy.get(`[data-test=contact-editor-name]`).click().clear().type("New Name", { delay: 0 });
      cy.get(`[data-test=contact-editor-email]`).click().clear().type("someone@gmail.com", { delay: 0 });
      cy.get(`[data-test=contact-editor-save]`).click();
      cy.get(`[data-test=contact-name]`).contains("New Name").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`)
        .contains("New Name")
        .should("exist");
      cy.get(`[data-test=gig-edit-${gig.id}-client-search]`).click().type("someone@gmail.com", { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-client-search-results]`).contains("New Name").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-client-search]`).click().clear().type(contacts[0].name, { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-client-search-results]`).contains("New Name").should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-client-search-results]`).contains(contacts[0].name).should("not.exist");
    });

    it("clears unwanted fields when saving calendar events", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-food-provided]`).check().uncheck().check();
      cy.get(`[data-test=gig-edit-${gig.id}-allow-signups]`).check();
      cy.get(`[data-test=gig-edit-${gig.id}-advertise]`).check();
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.get(`[href='/members/gigs/${gig.id}']`).click();
      cy.url().should("not.contain", "edit");
      cy.contains("Arrive time").should("be.visible");
      cy.contains("Start time").should("be.visible");
      cy.contains("Finish time").should("be.visible");
      cy.get(`[data-test=show-signup-${gig.id}]`).should("be.visible")
      cy.get(`[data-test=icon-food-provided]`).should("be.visible");
      cy.get(`[href='/members/gigs/${gig.id}/edit']`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-type] [data-test=select-box]`).select("Calendar Dates");
      cy.get(`[data-test=gig-edit-${gig.id}-date]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-date]`).type("2021-01-01");
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-date]`).type("2021-01-03");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.get(`[href='/members/gigs/${gig.id}']`).click();
      cy.url().should("not.contain", "edit");
      cy.contains("Arrive time").should("not.exist");
      cy.contains("Start time").should("not.exist");
      cy.contains("Finish time").should("not.exist");
      cy.get(`[data-test=show-signup-${gig.id}]`).should("not.exist")
      cy.get(`[data-test=icon-food-provided]`).should("not.exist");
    });
  });

  context("not saving changes", () => {
    before(() => {
      cy.executeMutation(SetResetGig, {
        variables: {
          ...gig,
          where_delete_contacts: { _or: [{ name: { _like: "A Client%" } }, { name: { _like: "A Caller%" } }] },
          where_delete_venues: { name: { _like: "%og on%" } },
          create_contacts: contacts,
          create_venues: venues,
        },
      });
    });

    beforeEach(() => {
      cy.login("cypress", "abc123");
      cy.visit(`/members/gigs/${gig.id}/edit`);
    });

    it("warns when gig is unusually long", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-time]`).click().type("10:00");
      cy.get(`[data-test=gig-edit-${gig.id}-infer-finish-date]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-timing-warnings]`)
        .children()
        .should("have.length", 1)
        .and("contain", "longer than 6 hours");
    });

    it("can preview a gig summary", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-show-preview]`).pipe(click).should("not.exist");
      cy.get(`[data-test=gig-summary-${gig.id}]`)
        .should("contain", gig.title)
        .and("contain", Cypress.DateTime.fromISO(gig.arriveTime).toFormat("HH:mm"))
        .and("contain", gig.time)
        .and("contain", "Deposit received")
        .and("contain", "Caller not paid")
        .and("contain", gig.venue.data.name)
        .and("not.contain", "Edit gig");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`).select(
        "A really long venue name to search for 1",
      );

      cy.get(`[data-test=gig-summary-${gig.id}]`)
        .should("contain", gig.title)
        .and("contain", Cypress.DateTime.fromISO(gig.arriveTime).toFormat("HH:mm"))
        .and("contain", gig.time)
        .and("contain", "Deposit received")
        .and("contain", "Caller not paid")
        .and("contain", "A really long venue name to search for 1");

      cy.get(`[data-test=gig-edit-${gig.id}-hide-preview]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-finance-payment]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-finance-caller]`).check();
      cy.get(`[data-test=gig-edit-${gig.id}-advertise]`).check();
      cy.get(`[data-test=gig-edit-${gig.id}-summary]`).click().type("Some public advert", { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-show-preview]`).click();
      cy.get(`[data-test=gig-summary-${gig.id}]`)
        .should("contain", "Payment received")
        .and("contain", "Caller paid")
        .and("contain", "Public advert")
        .and("contain", "Some public advert");

      cy.get(`[data-test=gig-edit-${gig.id}-create-venue]`).click();
      cy.get(`[data-test=venue-editor-cancel]`).click();
      cy.get(`[data-test=gig-summary-${gig.id}]`).should("contain", "A really long venue name to search for 1");
    });

    it("hides unneeded fields for calendar dates", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-type] [data-test=select-box]`).select("Calendar Dates");
      cy.get(`[data-test=gig-edit-${gig.id}-finance]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-finance-caller]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-advertise]`).should("not.exist");
    });

    it("hides unneeded fields for kit", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-type] [data-test=select-box]`).select("Kit Borrowing");
      cy.get(`[data-test=gig-edit-${gig.id}-finance]`).should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-finance-caller]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-advertise]`).should("not.exist");
    });

    it("disables details fields for cancelled gigs", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-type] [data-test=select-box]`).select("Cancelled Gig");
      cy.get(`[data-test=gig-edit-${gig.id}-finance]`).should("not.be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-finance-deposit]`).should("not.be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).should("be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-allow-signups]`).should("not.be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-admins-only]`).should("not.be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-title]`).should("be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-date]`).should("be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search]`).should("be.disabled");
    });
  });
});
