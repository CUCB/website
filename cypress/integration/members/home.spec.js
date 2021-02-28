import {
  CreateGig,
  DeleteSignup,
  SignupDetails,
  AddInstrument,
  RemoveInstruments,
  InstrumentsOnGig,
} from "../../database/gigs";
import { CreateUser, HASHED_PASSWORDS } from "../../database/users";

const click = ($el) => $el.click(); // For retrying clicks, see https://www.cypress.io/blog/2019/01/22/when-can-the-test-click/

let colors = {};

describe("members' home page", () => {
  before(() => {
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

  describe("theme editor", () => {
    beforeEach(() => {
      cy.login("cypress_user", "abc123");
      cy.visit("/members");
    });

    it("can change and reset accent colour", () => {
      cy.get("[data-test=settings-cog]").click();
      cy.get("[data-test=change-accent-color]").click();
      cy.get("#colorsquare-event").click();
      cy.get("#hue-event").click();
      cy.get("#colorsquare-event").click();
      cy.get(".hex-text-block > .text")
        .invoke("text")
        .then((hexAccent) => {
          cy.get("[data-test=accent-popup] [data-test=icon-close]").click();
          cy.get("#colorsquare-event").should("not.exist");
          cy.get("[data-test=accent-popup]").should("not.exist");
          expect(hexAccent.toLowerCase()).to.eq("#3e7e7c");
          cy.get("[data-test=icon-close]").click();
          cy.get("nav a").should("have.color", "#3e7e7c");
          cy.reload();
          cy.get("nav a").should("have.color", "#3e7e7c");
          cy.get("[data-test=settings-cog]").click();
          cy.get("[data-test=reset-accent-color]").click();
          cy.get("[data-test=icon-close]").click();
          cy.get("nav a").should("not.have.color", "#3e7e7c");
        });
    });

    it("can change and reset logo colour", () => {
      cy.get("[data-test=settings-cog]").click();
      cy.get("[data-test=change-logo-color]").click();
      cy.get("#hue-event").click();
      cy.get("#colorsquare-event").click();
      cy.get(".hex-text-block > .text")
        .invoke("text")
        .then((hexLogoColour) => {
          cy.get("[data-test=logo-popup] [data-test=icon-close]").click();
          cy.get("#colorsquare-event").should("not.exist");
          cy.get("[data-test=logo-popup]").should("not.exist");
          expect(hexLogoColour.toLowerCase()).to.eq("#3e7e7c");
          cy.get("[data-test=icon-close]").click();
          cy.get("[data-test=logo] path").should("have.stroke", "#3e7e7c");
          cy.reload();
          cy.get("[data-test=logo] path").should("have.stroke", "#3e7e7c");
          cy.get("[data-test=settings-cog]").click();
          cy.get("[data-test=reset-logo-color]").click();
          cy.get("[data-test=icon-close]").click();
          cy.get("[data-test=logo] path").should("not.have.stroke", "#3e7e7c");
        });
    });

    it("preserves accents and logo colours for different themes", () => {
      cy.get("[data-test=settings-cog]").click();
      cy.get("[data-test=select-theme] [data-test=select-box]").select("dark");
      cy.get("[data-test=confirm-theme]").click();
      cy.get(".theme-dark").should("exist");

      cy.get("[data-test=change-accent-color]").click();
      cy.get("#hue-event").click();
      cy.get("#colorsquare-event").click("topRight", { force: true });
      cy.get("[data-test=accent-popup] [data-test=icon-close]").click();
      cy.get("[data-test=change-logo-color]").click();
      cy.get("#hue-event").click("right");
      cy.get("#colorsquare-event").click("topRight", { force: true });
      cy.get("[data-test=logo-popup] [data-test=icon-close]").click();

      cy.get("[data-test=select-theme] [data-test=select-box]").select("light");
      cy.get("[data-test=confirm-theme]").click();
      cy.get(".theme-light").should("exist");
      cy.get(".theme-dark").should("not.exist");

      cy.get("[data-test=change-accent-color]").click();
      cy.get("#hue-event").click("right");
      cy.get("#colorsquare-event").click("topRight", { force: true });
      cy.get("[data-test=accent-popup] [data-test=icon-close]").click();
      cy.get("[data-test=change-logo-color]").click();
      cy.get("#hue-event").click();
      cy.get("#colorsquare-event").click("topRight", { force: true });
      cy.get("[data-test=logo-popup] [data-test=icon-close]").click();

      cy.get("[data-test=select-theme] [data-test=select-box]").select("dark");
      cy.get("[data-test=confirm-theme]").click();

      cy.get("[data-test=logo] path").should("have.stroke", "#fc2900");
      cy.get("nav a").should("have.color", "#00fcf5");

      cy.get(".theme-dark").should("exist");
      cy.get(".theme-light").should("not.exist");
      cy.get("[data-test=icon-close]").click();

      cy.reload();
      cy.get("[data-test=logo] path").should("have.stroke", "#fc2900");

      cy.get("[data-test=settings-cog]").click();
      cy.get("[data-test=select-theme] [data-test=select-box]").select("light");
      cy.get("[data-test=confirm-theme]").click();
      cy.get("[data-test=icon-close]").click();
      cy.get(".theme-light").should("exist");
      cy.get(".theme-dark").should("not.exist");

      cy.get("[data-test=logo] path").should("have.stroke", "#00fcf5");
      cy.get("nav a").should("have.color", "#fc2900");
    });

    Cypress.Commands.add("assertLogoRotates", () => {
      cy.get("[data-test=logo]")
        .invoke("css", "transform")
        .then((rotation) => {
          let container = {};
          Cypress.$("[data-test=logo]").on("beginRotate", (e) => (container.e = e));
          cy.get("[data-test=logo]")
            .trigger("mouseover", "bottomRight")
            .invoke("css", "transform")
            .should("not.eq", rotation);
          cy.get("[data-test=logo]").trigger("mouseout");
          cy.wrap(container).should((container) => expect(container.e).not.to.be.undefined);
        });
    });

    Cypress.Commands.add("assertLogoDoesntRotate", () => {
      let container = {};
      Cypress.$("[data-test=logo]").on("noRotate", (e) => (container.e = e));
      cy.get("[data-test=logo]").trigger("mouseover", "bottomRight");
      cy.get("[data-test=logo]").trigger("mouseout");
      cy.wrap(container).should((container) => expect(container.e).not.to.be.undefined);
    });

    it("can enable and disable the spinny logo", () => {
      cy.get("[data-test=settings-cog]").click();
      cy.get("[data-test=check-spinny-logo]").check();
      cy.get("[data-test=icon-close]").click();
      cy.assertLogoRotates();

      cy.get("[data-test=settings-cog]").click();
      cy.get("[data-test=check-spinny-logo]").uncheck();
      cy.get("[data-test=icon-close]").click();
      cy.assertLogoDoesntRotate();

      cy.reload();
      cy.waitForFormInteractive();
      cy.assertLogoDoesntRotate();

      cy.get("[data-test=settings-cog]").click();
      cy.get("[data-test=check-spinny-logo]").check();
      cy.get("[data-test=icon-close]").click();
      cy.assertLogoRotates();
      cy.reload();
      cy.waitForFormInteractive();
      cy.assertLogoRotates();
    });

    it("preserves settings when logging in again", () => {
      const LOGO = "#fc0000";
      const ACCENT_LIGHT = "#00fcf5";
      const ACCENT_DARK = "#3e7e7c";
      cy.get("[data-test=settings-cog]").click();

      cy.get("[data-test=change-accent-color]").click();
      cy.get("#hue-event").click();
      cy.get("#colorsquare-event").click("topRight", { force: true });
      cy.get("[data-test=accent-popup] [data-test=icon-close]").click();
      cy.get("nav a").should("have.color", ACCENT_LIGHT);

      cy.get("[data-test=change-logo-color]").click();
      cy.get("#colorsquare-event").click("topRight", { force: true });
      cy.get("[data-test=logo-popup] [data-test=icon-close]").click();
      cy.get("[data-test=logo] path").should("have.stroke", LOGO);

      cy.get("[data-test=check-spinny-logo]").check();
      cy.get("[data-test=select-calendar-day] [data-test=select-box]").select("Tuesday");
      cy.get('[data-test=confirm-calendar-day]').click();
      cy.get("[data-test=icon-close]").click();

      cy.get("[data-test=settings-cog]").click();
      cy.get("[data-test=select-theme] [data-test=select-box]").select("dark");
      cy.get("[data-test=confirm-theme]").click();
      cy.get("[data-test=change-accent-color]").click();
      cy.get("#hue-event").click();
      cy.get("#colorsquare-event").click();
      cy.get("[data-test=accent-popup] [data-test=icon-close]").click();
      cy.get("nav a").should("have.color", ACCENT_DARK);
      // I have no idea why Cypress thinks there are multiple close buttons
      // It seems to work this way so probably is fine unless someone discovers
      // it's an actual bug. My own (very brief) manual testing of this seems to 
      // suggest it's fine and there isn't a problem with it.
      cy.get("[data-test=icon-close]").first().click();

      cy.get("[data-test=logo] path").should("not.have.stroke", LOGO);

      cy.contains("Log out").click();
      cy.contains("Log in").click();
      cy.get("[data-test=username]").type("cypress_user");
      cy.get("[data-test=password]").type("abc123");
      cy.get("[data-test=submit]").click();

      cy.get("nav a").should("have.color", ACCENT_DARK);
      cy.assertLogoRotates();

      cy.get("[data-test=settings-cog]").click();
      cy.get("[data-test=select-theme] [data-test=select-box]").select("default");
      cy.get("[data-test=select-calendar-day] [data-test=select-box] option:selected").should("have.text", "Tuesday");
      cy.get("[data-test=confirm-theme]").click();
      cy.get("[data-test=icon-close]").click()

      cy.get("nav a").should("have.color", ACCENT_LIGHT);
      cy.get("[data-test=logo] path").should("have.stroke", LOGO);
      cy.assertLogoRotates();
    });
  });
});

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
      cy.executeMutation(RemoveInstruments, {
        variables: {
          userId: 27250,
        },
      });
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
