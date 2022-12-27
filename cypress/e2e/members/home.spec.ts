let colors: { positive?: string; negative?: string; neutral?: string } = {};

describe("members' home page", () => {
  before(() => {
    cy.task("db:create_login_users");
  });

  it("gives 401 error when not logged in", () => {
    cy.request({
      url: "/members",
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 401);
  });

  it("displays when logged in", () => {
    cy.login("cypress_user", "abc123");
    cy.visit("/members");
    cy.get("h1").contains("Members");
  });
});

describe("gig signup", () => {
  before(() => {
    cy.visit("/");
    cy.task("db:create_gig", {
      id: "15275",
      title: "A gig I created earlier",
      type: "1",
      admins_only: false,
      allow_signups: true,
      date: "2020-08-01",
      venue: {
        name: "Venue with no information",
        subvenue: null,
        id: "32774527",
      },
    });
    cy.task("db:create_gig", {
      id: "15274",
      title: "Cypress Demo Gig",
      type: "1",
      admins_only: false,
      allow_signups: true,
      date: "2020-07-17",
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
    });
    cy.task("db:create_login_users");
    cy.task("db:delete_signup", { user_id: "27250", gig_id: "15274" });
    cy.cssProperty("--positive").then((positive_) => (colors.positive = positive_));
    cy.cssProperty("--negative").then((negative_) => (colors.negative = negative_));
    cy.cssProperty("--neutral").then((neutral_) => (colors.neutral = neutral_));
  });

  beforeEach(() => {
    cy.clock(Cypress.DateTime.fromISO("2020-07-07T02:00").valueOf());
  });

  it("allows a user to sign up to a gig", () => {
    cy.login("cypress_user", "abc123");
    cy.visit("/members");
    cy.waitForFormInteractive();

    cy.get(`[data-test="gig-15274-signup-yes"]`).should("not.have.color", colors.positive);
    cy.get(`[data-test="gig-15274-signup-yes"]`).click().should("have.color", colors.positive);

    cy.get(`[data-test="gig-15274-signup-maybe"]`).should("not.have.color", colors.neutral);
    cy.get(`[data-test="gig-15274-signup-maybe"]`).click().should("have.color", colors.neutral);

    cy.get(`[data-test="gig-15274-signup-no"]`).should("not.have.color", colors.negative);
    cy.get(`[data-test="gig-15274-signup-no"]`).click().should("have.color", colors.negative);
  });

  it("displays gigs in chronological order", () => {
    cy.login("cypress_user", "abc123");
    cy.visit("/members");
    cy.get("h3").then((elements) => {
      const datetimes = elements.toArray().map((elem) => {
        const time = elem.querySelector("time");
        if (time) {
          return time.getAttribute("datetime");
        } else {
          return null;
        }
      });
      expect(elements).to.contain("A gig I created earlier");
      expect(elements).to.contain("Cypress Demo Gig");
      expect(datetimes).to.not.contain(null);
      expect(datetimes).to.be.sorted();
    });
    cy.contains("A gig I created earlier");
    cy.contains("Cypress Demo Gig");
  });

  it("displays addresses for gig venues", () => {
    cy.login("cypress_user", "abc123");
    cy.visit("/members");
    cy.get('[data-test="gig-signup-15274"] [data-test=venue-map-link]')
      .should("have.attr", "href")
      .and(
        "eq",
        "https://www.google.com/maps/place/Emmanuel+United+Reformed+Church/@52.2014254,0.1182611,15z/data=!4m5!3m4!1s0x0:0x4386e0813db16b3e!8m2!3d52.2014254!4d0.1182611",
      );
    cy.get('[data-test="gig-signup-15274"] [data-test=venue-address]')
      .tooltipInnerHTML()
      .should("eq", "3 Trumpington St, Cambridge<br>CB2 1QY");
    cy.get('[data-test="gig-signup-15275"]').contains("Venue with no information").should("be.visible");
    cy.get('[data-test="gig-signup-15275"] [data-test=venue-address]').should("not.exist");
  });

  context("without_instruments", () => {
    before(() => {
      cy.task("db:delete_instruments_for_user", "27250");
      cy.login("cypress_user", "abc123");
      cy.visit("/members");
      cy.waitForFormInteractive();
    });

    it("links to user profile when editing instruments", () => {
      cy.intercept("POST", "/members/gigs/15274/signup", {
        fixture: "gig/signup/yes.json",
      }).as("signup");
      cy.get(`[data-test="gig-15274-signup-yes"]`).click().should("have.color", colors.positive);
      cy.wait("@signup");
      cy.get(`[data-test="gig-15274-signup-edit"]`).click();
      cy.get(`a[href="/members/users"]`).should("exist");
    });
  });

  context("with instruments", () => {
    before(() => {
      cy.task("db:delete_instruments_for_user", "27250");
      cy.task("db:create_user_instrument", { id: "28474292", user: "27250", instrument: "53" });
      cy.task("db:create_user_instrument", { id: "28474293", user: "27250", instrument: "20" });
      cy.login("cypress_user", "abc123");
      cy.visit("/members");
      cy.waitForFormInteractive();
    });

    it("allows adding and editing of instruments", () => {
      cy.intercept({
        method: "POST",
        url: "/members/gigs/15274/signup",
      }).as("signupRequest");

      cy.get(`[data-test="gig-15274-signup-yes"]`).click().should("have.color", colors.positive);
      cy.wait("@signupRequest");
      cy.get(`[data-test="gig-15274-signup-edit"]`).click();
      cy.get(`[data-test="gig-15274-signup-instrument-53-toggle"]`).click();
      cy.get(`[data-test="gig-15274-signup-save"]`).click();
      cy.wait("@signupRequest");
      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`).contains("Trombone").should("exist");
      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`).contains("Wind Synth").should("not.exist");
      cy.get(`[data-test="gig-15274-signup-edit"]`).click();
      cy.get(`[data-test="gig-15274-signup-instrument-20-toggle"]`).click();
      cy.get(`[data-test="gig-15274-signup-instrument-53-toggle"]`).click();
      cy.get(`[data-test="gig-15274-signup-save"]`).click();
      cy.wait("@signupRequest");
      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`).contains("Trombone").should("not.exist");
      cy.get(`[data-test="gig-15274-signup-instruments-selected"]`).contains("Wind Synth").should("exist");
    });
  });
});
