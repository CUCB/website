const click = ($el) => $el.click(); // For retrying clicks, see https://www.cypress.io/blog/2019/01/22/when-can-the-test-click/

let colors = {};

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
      id: "15274",
      title: "Cypress Demo Gig",
      type: "1",
      admins_only: false,
      allow_signups: true,
      date: "2020-07-17",
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
    cy.get(`[data-test="gig-15274-signup-yes"]`).should("not.have.color", colors.positive);
    cy.get(`[data-test="gig-15274-signup-yes"]`).pipe(click).should("have.color", colors.positive);

    cy.get(`[data-test="gig-15274-signup-maybe"]`).should("not.have.color", colors.netural);
    cy.get(`[data-test="gig-15274-signup-maybe"]`).click().should("have.color", colors.neutral);

    cy.get(`[data-test="gig-15274-signup-no"]`).should("not.have.color", colors.negative);
    cy.get(`[data-test="gig-15274-signup-no"]`).click().should("have.color", colors.negative);
  });

  context("without_instruments", () => {
    before(() => {
      cy.task("db:delete_instruments_for_user", "27250");
      cy.login("cypress_user", "abc123");
      cy.visit("/members");
    });

    it("links to user profile when editing instruments", () => {
      cy.waitForFormInteractive();
      cy.intercept("POST", "/members/gigs/15274/signup", {
        fixture: "gig/signup/yes.json",
      }).as("signup");
      cy.get(`[data-test="gig-15274-signup-yes"]`).pipe(click).should("have.color", colors.positive);
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
    });

    it("allows adding and editing of instruments", () => {
      cy.intercept({
        method: "POST",
        url: "/members/gigs/15274/signup",
      }).as("signupRequest");

      cy.get(`[data-test="gig-15274-signup-yes"]`).pipe(click).should("have.color", colors.positive);
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
