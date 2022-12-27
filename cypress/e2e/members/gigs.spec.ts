/// <reference types="Cypress" />

import { String } from "runtypes";

let colors: { unselected?: string; positive?: string; negative?: string; neutral?: string } = {};

let gigForSummary = {
  id: "74527",
  type: "1",
  title: "Gig of excitement",
  admins_only: false,
  allow_signups: true,
  date: "2020-07-25",
  time: "21:00",
  notes_admin: "This is an admin note",
  notes_band: "This is a band note",
  arrive_time: Cypress.DateTime.fromISO("2020-07-25T20:00+01:00").toJSDate(),
  finish_time: Cypress.DateTime.fromISO("2020-07-25T23:00+01:00").toJSDate(),
  finance_deposit_received: true,
  finance_payment_received: false,
  finance_caller_paid: false,
  venue: {
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
    id: "3277452",
  },
  lineup: [
    {
      approved: true,
      leader: true,
      equipment: false,
      money_collector: false,
      driver: false,
      user: {
        id: "374325",
        username: "leady374325",
        first: "Leady",
        last: "Lead",
        email: "user374325@testi.ng",
        instruments: [
          {
            id: "105747",
            deleted: false,
            instrument: "20",
            nickname: null,
          },
          {
            id: "576743",
            deleted: true,
            instrument: "63",
            nickname: "Cluck cluck",
          },
        ],
      },
      user_instruments: [
        {
          user_instrument_id: "105747",
          approved: true,
        },
        {
          user_instrument_id: "576743",
          approved: true,
        },
      ],
    },
    {
      approved: true,
      leader: false,
      equipment: true,
      driver: true,
      money_collector: true,
      user: {
        id: "567236",
        username: "User567236",
        first: "Twizzly",
        last: "Dialy",
        email: "user567236@testi.ng",
        instruments: [
          {
            id: "5765073",
            deleted: false,
            instrument: "66",
            nickname: null,
          },
        ],
      },
    },
  ],
};

let adminOnlyGig = {
  ...gigForSummary,
  id: (parseInt(gigForSummary.id) + 1).toString(),
  title: "Admin only gig",
  date: Cypress.DateTime.local().plus({ months: 1 }),
  arrive_time: null,
  finish_time: null,
  admins_only: true,
};

describe("gig summary", () => {
  let gig = gigForSummary;
  before(() => {
    cy.task("db:create_login_users");
    cy.task("db:delete_signups", gig.id);
    cy.task("db:create_gig", gig);
  });

  context("not logged in", () => {
    it("isn't accessible", () => {
      cy.request({ url: `/members/gigs/${gig.id}`, failOnStatusCode: false })
        .its("status")
        .should("eq", 401);
    });
  });

  context("logged in as normal user", () => {
    beforeEach(() => {
      // Changed from before to beforeEach as some tests were flaky
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
        .should("have.value", gig.venue.id)
        .find(":selected")
        .invoke("html")
        .invoke("trim")
        .should("eq", gig.venue.name);
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
    arrive_time: Cypress.DateTime.local().plus({ months: 1 }).set({ hour: 18, minute: 30 }).toJSDate(),
    finish_time: Cypress.DateTime.local().plus({ months: 1 }).set({ hour: 22, minute: 0 }).toJSDate(),
  };

  let nonSignupGig = {
    ...gigForSummary,
    id: 34743274,
    allow_signups: false,
    date: Cypress.DateTime.local().plus({ days: 60 }).toFormat("yyyy-LL-dd"),
    time: Cypress.DateTime.local().set({ hour: 19, minute: 0 }).toFormat("HH:mm"),
    arrive_time: Cypress.DateTime.local().plus({ days: 60 }).set({ hour: 18, minute: 0 }).toJSDate(),
    finish_time: Cypress.DateTime.local().plus({ days: 60 }).set({ hour: 21, minute: 15 }).toJSDate(),
  };

  let pastGig = {
    ...gigForSummary,
    id: 33274,
    allow_signups: false,
    date: Cypress.DateTime.local().plus({ months: -2 }).toFormat("yyyy-LL-dd"),
    time: Cypress.DateTime.local().set({ hour: 19, minute: 30 }).toFormat("HH:mm"),
    arrive_time: Cypress.DateTime.local().plus({ months: -2 }).set({ hour: 18, minute: 30 }).toJSDate(),
    finish_time: Cypress.DateTime.local().plus({ months: -2 }).set({ hour: 22, minute: 0 }).toJSDate(),
  };

  before(() => {
    cy.visit("/");
    cy.task("db:create_gig", signupGig);
    cy.task("db:create_gig", nonSignupGig);
    cy.task("db:create_gig", pastGig);
    cy.task("db:delete_signup", { gig_id: nonSignupGig.id, user_id: "27250" });
    cy.task("db:delete_signup", { gig_id: signupGig.id, user_id: "27250" });
    cy.task("db:delete_instruments_for_user", "27250");
    cy.task("db:create_user_instrument", {
      id: "28474292",
      user: "27250",
      instrument: "53",
    });
    cy.task("db:create_user_instrument", {
      id: "28474293",
      user: "27250",
      instrument: "20",
    });
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
        cy.task("db:delete_signup", { user_id: "27250", gig_id: signupGig.id });
        cy.visit("/members/gigs");
        cy.waitForFormInteractive();
      });

      it("allows a user to sign up to a gig and change their signup status", () => {
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .click()
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
        cy.log("Successfully signed up to gig");

        cy.get(`[data-test=show-summary-${signupGig.id}]`).click();
        cy.get(`[data-test=show-signup-${signupGig.id}]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).should("have.color", colors.unselected);
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).should("have.color", colors.neutral);
      });

      it("retains signup information on refresh", () => {
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .click()
          .should(($el) => {
            expect($el).to.not.be.visible;
          });
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.unselected);
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-${signupGig.id}-signup-edit]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-instrument-20-toggle]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-save]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-save]`).should("not.exist");

        cy.visit("/members/gigs");
        cy.waitForFormInteractive();
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .click()
          .should(($el) => {
            expect($el).to.not.be.visible;
          });
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-signup-${signupGig.id}]`).contains("Wind Synth");
        cy.get(`[data-test=gig-${signupGig.id}-signup-no]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-no]`).should("have.color", colors.negative);

        cy.visit("/members/gigs");
        cy.waitForFormInteractive();
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .click()
          .should(($el) => {
            expect($el).to.not.be.visible;
          });
        cy.get(`[data-test=gig-${signupGig.id}-signup-no]`).should("have.color", colors.negative);
      });

      Cypress.Commands.add("selectPreviousMonth", () => {
        cy.get(`[data-test=gigcalendar-displayed-date]`)
          .invoke("text")
          .then((month) => {
            cy.get(`[data-test=gigcalendar-previous-month]`).click();
            cy.get(`[data-test=gigcalendar-displayed-date]`).invoke("text").should("not.eq", month);
          });
      });

      Cypress.Commands.add("selectNextMonth", () => {
        cy.get(`[data-test=gigcalendar-displayed-date]`)
          .invoke("text")
          .then((month) => {
            cy.get(`[data-test=gigcalendar-next-month]`).click();
            cy.get(`[data-test=gigcalendar-displayed-date]`).invoke("text").should("not.eq", month);
          });
      });

      it("retains signup information when gig is hidden and then redisplayed", () => {
        cy.get(`[data-test=show-signup-${signupGig.id}]`)
          .click()
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
        cy.selectPreviousMonth();
        cy.selectNextMonth();
        cy.selectNextMonth();

        cy.get(`[data-test=show-signup-${signupGig.id}]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-signup-${signupGig.id}]`).contains("Wind Synth");

        cy.visit("/members/gigs");
        cy.waitForFormInteractive();
        cy.get(`[data-test=gigview-by-month]`).click().should("not.exist"); // Click it until link becomes text
        cy.selectNextMonth();
        cy.get(`[data-test=show-signup-${signupGig.id}]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-yes]`).should("have.color", colors.positive);
        cy.get(`[data-test=gig-signup-${signupGig.id}]`).contains("Wind Synth");

        cy.get(`[data-test=gig-${signupGig.id}-signup-edit]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-instrument-20-toggle]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-save]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).click();

        cy.get(`[data-test=gigcalendar-next-month]`)
          .click()
          .parent()
          .parent()
          .should("contain", Cypress.DateTime.local().plus({ months: 2 }).toFormat("LLLL"));
        cy.get(`[data-test=gigview-all-upcoming]`).click().should("not.exist");
        cy.get(`[data-test=show-signup-${signupGig.id}]`).click();
        cy.get(`[data-test=gig-${signupGig.id}-signup-maybe]`).should("have.color", colors.neutral);
        cy.get(`[data-test=gig-signup-${signupGig.id}]`).contains("No instruments selected");
      });

      it("can switch between upcoming and past gigs", () => {
        cy.get(`[data-test=gig-summary-${pastGig.id}]`).should("not.exist");
        cy.get(`[data-test=gigview-by-month]`).click().should("not.exist");
        cy.intercept({ method: "GET", url: /^\/members\/gigs.json/ }).as("fetchGigs");
        cy.selectPreviousMonth();
        cy.wait("@fetchGigs");
        cy.selectPreviousMonth();
        cy.wait("@fetchGigs");
        cy.get(`[data-test=gig-summary-${pastGig.id}]`).should("be.visible");
        cy.selectPreviousMonth();
        cy.wait("@fetchGigs");
        cy.contains(Cypress.DateTime.local().minus({ months: 3 }).toFormat("LLLL yyyy")).should("exist");
        cy.get(`[data-test=gig-summary-${pastGig.id}]`).should("not.exist");
        cy.get(`[data-test=gigview-all-upcoming]`).click().should("not.exist");
        cy.get(`[data-test=gig-summary-${signupGig.id}]`).should("be.visible");
      });
    });
  });
});

describe("iCal files", () => {
  const months = 1;
  let gig = {
    ...gigForSummary,
    date: Cypress.DateTime.local().plus({ months }).toISODate(),
    arrive_time: Cypress.DateTime.local()
      .plus({ months })
      .set({ hour: 20, minute: 0, second: 0, millisecond: 0 })
      .toJSDate(),
    finish_time: Cypress.DateTime.local()
      .plus({ months })
      .set({ hour: 23, minute: 0, second: 0, millisecond: 0 })
      .toJSDate(),
  };
  before(() => {
    cy.task("db:create_login_users");
    cy.task("db:delete_gig", gig.id);
    cy.task("db:create_gig", gig);
    cy.task("db:create_gig", adminOnlyGig);
  });

  it("can be generated per-gig", () => {
    cy.login("cypress", "abc123");
    cy.visit(`/members/gigs/${gig.id}`);
    cy.contains("Download iCal").then((link) => {
      // @ts-ignore
      const linksTo = link.attr("href");
      cy.request(String.check(Cypress.config().baseUrl).replace(/\/?$/, linksTo)).then((res) => {
        const data = ICAL.parse(res.body);
        const comp = new ICAL.Component(data);
        const vevent = comp.getFirstSubcomponent("vevent");
        const event = new ICAL.Event(vevent);
        let tz = comp.getFirstProperty("timezone-id").getFirstValue();
        expect(tz).to.eq("Europe/London");
        const startDate = Cypress.DateTime.fromObject({ ...event.startDate._time, isDate: undefined });
        const endDate = Cypress.DateTime.fromObject({ ...event.endDate._time, isDate: undefined });
        expect(event.summary).to.eq(`GIG: Gig of excitement`);
        expect(event.description).to.contain("Leady Lead").and.contain("[Eigenharp, Wind Synth]");
        expect(startDate.equals(Cypress.DateTime.fromJSDate(gig.arrive_time))).to.be.true;
        expect(endDate.equals(Cypress.DateTime.fromJSDate(gig.finish_time))).to.be.true;
      });
    });
  });

  describe("for president", () => {
    beforeEach(() => {
      cy.login("cypress_president", "abc123");
      cy.task("db:delete_gig", gig.id);
      cy.task("db:create_gig", gig);
    });

    it("contains admin information", () => {
      // TODO verify the appropriate contact information is displayed too
      cy.request(`/members/gigs/${gig.id}/calendar`).then((res) => {
        const data = ICAL.parse(res.body);
        const comp = new ICAL.Component(data);
        const vevent = comp.getFirstSubcomponent("vevent");
        const event = new ICAL.Event(vevent);
        expect(event.summary).to.eq(`GIG: Gig of excitement`);
        expect(event.description).to.contain("OTHER INFO: This is a band note");
        expect(event.description).to.contain("ADMIN NOTES: This is an admin note");
      });
    });

    it("can be generated for all gigs", () => {
      cy.request(`/members/gigs/calendar/all`).then((res) => {
        const data = ICAL.parse(res.body);
        const comp = new ICAL.Component(data);
        const events = comp.getAllSubcomponents("vevent").map((vevent) => new ICAL.Event(vevent));
        const event = events.find((event) => event.summary === "GIG: Admin only gig");
        expect(event).to.not.be.undefined;
        expect(event.description).to.contain("Leady Lead").and.contain("[Eigenharp, Wind Synth]");
        expect(event.description).to.contain("OTHER INFO: This is a band note");
        expect(event.description).to.contain("ADMIN NOTES: This is an admin note");
        const tz = comp.getFirstProperty("timezone-id").getFirstValue();
        expect(tz).to.eq("Europe/London");
        const startDate = Cypress.DateTime.fromObject({ ...event.startDate._time, isDate: undefined });
        const endDate = Cypress.DateTime.fromObject({ ...event.endDate._time, isDate: undefined });
        const midnight = { hour: 0, minute: 0, second: 0, millisecond: 0 };
        expect(startDate.equals(adminOnlyGig.date.set(midnight))).to.be.true;
        expect(endDate.equals(adminOnlyGig.date.set(midnight).plus({ days: 1 }))).to.be.true;
      });
    });

    it("can be generated for my gigs", () => {
      const expectedSummary = "GIG: Gig of excitement";
      cy.request("POST", `/members/gigs/${gig.id}/signup`, { user_available: true, user_only_if_necessary: false });

      cy.request(`/members/gigs/calendar/my`).then((res) => {
        const data = ICAL.parse(res.body);
        const comp = new ICAL.Component(data);
        const events = comp.getAllSubcomponents("vevent").map((vevent) => new ICAL.Event(vevent));
        const event = events.find((event) => event.summary === expectedSummary);
        expect(event).to.be.undefined;
      });

      cy.request(`/members/gigs/calendar/my`).then((res) => {
        const data = ICAL.parse(res.body);
        const comp = new ICAL.Component(data);
        const events = comp.getAllSubcomponents("vevent").map((vevent) => new ICAL.Event(vevent));
        const event = events.find((event) => event.summary === expectedSummary);
        expect(event).to.be.undefined;
      });

      cy.request("POST", `/members/gigs/${gig.id}/edit-lineup/update`, {
        type: "setPersonApproved",
        id: "27382",
        approved: true,
      });

      cy.request(`/members/gigs/calendar/my`).then((res) => {
        const data = ICAL.parse(res.body);
        const comp = new ICAL.Component(data);
        const events = comp.getAllSubcomponents("vevent").map((vevent) => new ICAL.Event(vevent));
        const event = events.find((event) => event.summary === expectedSummary);
        expect(event).not.to.be.undefined;

        expect(event.description).to.contain("Leady Lead").and.contain("[Eigenharp, Wind Synth]");
        expect(event.description).to.contain("Cypress President");
        expect(event.description).to.contain("OTHER INFO: This is a band note");
        expect(event.description).to.contain("ADMIN NOTES: This is an admin note");

        const tz = comp.getFirstProperty("timezone-id").getFirstValue();
      });
    });
  });

  describe("for normal user", () => {
    beforeEach(() => {
      cy.login("cypress_user", "abc123");
      cy.task("db:delete_gig", gig.id);
      cy.task("db:create_gig", gig);
    });

    it("omits admin information", () => {
      cy.request(`/members/gigs/${gig.id}/calendar`).then((res) => {
        const data = ICAL.parse(res.body);
        const comp = new ICAL.Component(data);
        const vevent = comp.getFirstSubcomponent("vevent");
        const event = new ICAL.Event(vevent);
        expect(event.summary).to.eq(`GIG: Gig of excitement`);
        expect(event.description).to.contain("OTHER INFO: This is a band note");
        expect(event.description).to.not.contain("ADMIN NOTES: This is an admin note");
      });
    });

    it("can be generated for all gigs excluding hidden gigs", () => {
      cy.request(`/members/gigs/calendar/all`).then((res) => {
        const data = ICAL.parse(res.body);
        const comp = new ICAL.Component(data);
        const events = comp.getAllSubcomponents("vevent").map((vevent) => new ICAL.Event(vevent));
        let event = events.find((event) => event.summary === "GIG: Admin only gig");
        expect(event).to.be.undefined;
        event = events.find((event) => event.summary === "GIG: Gig of excitement");
        expect(event).not.to.be.undefined;
        expect(event.description).to.contain("OTHER INFO: This is a band note");
        expect(event.description).not.to.contain("ADMIN NOTES: This is an admin note");
      });
    });

    it("can be generated for my gigs", () => {
      const expectedSummary = "GIG: Gig of excitement";
      cy.request(`/members/gigs/calendar/my`).then((res) => {
        const data = ICAL.parse(res.body);
        const comp = new ICAL.Component(data);
        const events = comp.getAllSubcomponents("vevent").map((vevent) => new ICAL.Event(vevent));
        const event = events.find((event) => event.summary === expectedSummary);
        expect(event).to.be.undefined;
      });

      cy.request("POST", `/members/gigs/${gig.id}/signup`, { user_available: true, user_only_if_necessary: false });

      cy.request(`/members/gigs/calendar/my`).then((res) => {
        const data = ICAL.parse(res.body);
        const comp = new ICAL.Component(data);
        const events = comp.getAllSubcomponents("vevent").map((vevent) => new ICAL.Event(vevent));
        const event = events.find((event) => event.summary === expectedSummary);
        expect(event).to.be.undefined;
      });

      cy.login("cypress_president", "abc123");
      cy.request("POST", `/members/gigs/${gig.id}/edit-lineup/update`, {
        type: "setPersonApproved",
        id: "27250",
        approved: true,
      });

      cy.login("cypress_user", "abc123");
      cy.request(`/members/gigs/calendar/my`).then((res) => {
        const data = ICAL.parse(res.body);
        const comp = new ICAL.Component(data);
        const events = comp.getAllSubcomponents("vevent").map((vevent) => new ICAL.Event(vevent));
        const event = events.find((event) => event.summary === expectedSummary);
        expect(event).not.to.be.undefined;
        expect(event.description).to.contain("OTHER INFO: This is a band note");
        expect(event.description).not.to.contain("ADMIN NOTES: This is an admin note");
        expect(event.description).to.contain("Leady Lead").and.contain("[Eigenharp, Wind Synth]");
        expect(event.description).to.contain("Cypress User");
      });
    });
  });
});

import ICAL from "ical.js";
import { IANAZone } from "luxon";
