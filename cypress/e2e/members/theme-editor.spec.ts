/// <reference types="Cypress" />

import { HASHED_PASSWORDS } from "../../database/users";

describe("theme editor", () => {
  before(() => {
    cy.task("db:create_custom_users", [
      {
        id: "2725552",
        username: "shiny_colours",
        saltedPassword: HASHED_PASSWORDS.abc123,
        admin: "9",
        email: "cypress.themetester@cypress.io",
        first: "Cypress",
        last: "ThemeTester",
      },
    ]);
  });

  beforeEach(() => {
    // Due to https://github.com/cypress-io/cypress/issues/17805, the session validation is essentially useless
    // In one test, we log out through the UI, so if we re-run all the tests, it's a bit broken
    // Also, we expect the colours to be the default when we log in, and this isn't necessarily true if the
    // session gets preserved.
    cy.loginWithoutCySession("shiny_colours", "abc123");
    cy.visit("/members");
  });

  const TEAL = ["#3e7e7c", "#3f807e"];
  const RED = ["#fc2900", "#fd2a00"];
  const CYAN = ["#00fcf5", "#00fdf7"];

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
        expect(TEAL).to.include(hexAccent.toLowerCase());
        cy.get("[data-test=icon-close]").click();
        cy.get("nav a").should("have.color", TEAL);
        cy.reload();
        cy.get("nav a").should("have.color", TEAL);
        cy.get("[data-test=settings-cog]").click();
        cy.get("[data-test=reset-accent-color]").click();
        cy.get("[data-test=icon-close]").click();
        cy.get("nav a").should("not.have.color", TEAL);
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
        expect(TEAL).to.include(hexLogoColour.toLowerCase());
        cy.get("[data-test=icon-close]").click();
        cy.get("[data-test=logo] path").should("have.stroke", TEAL);
        cy.reload();
        cy.get("[data-test=logo] path").should("have.stroke", TEAL);
        cy.get("[data-test=settings-cog]").click();
        cy.get("[data-test=reset-logo-color]").click();
        cy.get("[data-test=icon-close]").click();
        cy.get("[data-test=logo] path").should("not.have.stroke", TEAL);
      });
  });

  it("preserves accents and logo colours for different themes", () => {
    cy.intercept("POST", "/updatetheme").as("updateTheme");
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

    cy.get("[data-test=logo] path").should("have.stroke", RED);
    cy.get("nav a").should("have.color", CYAN);

    cy.get(".theme-dark").should("exist");
    cy.get(".theme-light").should("not.exist");
    cy.get("[data-test=icon-close]").click();
    cy.get("[data-test=icon-close]").should("not.exist");
    cy.wait("@updateTheme");

    cy.reload();
    cy.waitForFormInteractive();
    cy.get("[data-test=logo] path").should("have.stroke", RED);

    cy.get("[data-test=settings-cog]").click();
    cy.get("[data-test=select-theme] [data-test=select-box]").select("light");
    cy.get("[data-test=confirm-theme]").click();
    cy.get("[data-test=icon-close]").click();
    cy.get(".theme-light").should("exist");
    cy.get(".theme-dark").should("not.exist");

    cy.get("[data-test=logo] path").should("have.stroke", CYAN);
    cy.get("nav a").should("have.color", RED);
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
    cy.intercept("POST", "/updatetheme").as("updateTheme");
    cy.get("[data-test=settings-cog]").click();
    cy.get("[data-test=check-spinny-logo]").check();
    cy.get("[data-test=icon-close]").click();
    cy.assertLogoRotates();
    cy.wait("@updateTheme");

    cy.get("[data-test=settings-cog]").click();
    cy.get("[data-test=check-spinny-logo]").uncheck();
    cy.get("[data-test=icon-close]").click();
    cy.assertLogoDoesntRotate();
    cy.wait("@updateTheme");

    cy.reload();
    cy.waitForFormInteractive();
    cy.assertLogoDoesntRotate();

    cy.get("[data-test=settings-cog]").click();
    cy.get("[data-test=check-spinny-logo]").check();
    cy.get("[data-test=icon-close]").click();
    cy.assertLogoRotates();
    cy.wait("@updateTheme");
    cy.reload();
    cy.waitForFormInteractive();
    cy.assertLogoRotates();
  });

  it("preserves settings when logging in again", () => {
    const LOGO = ["#fc2900", "#fd2a00", "#fc0000", "#fd0000"];
    const ACCENT_DARK = ["#3e7e7c", "#3f807e"];
    const ACCENT_LIGHT = ["#00fcf5", "#00fdf7"];
    cy.intercept("POST", "/updatetheme").as("updateTheme");
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
    cy.get("[data-test=confirm-calendar-day]").click();
    cy.get("[data-test=icon-close]").click();
    cy.wait("@updateTheme");

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
    cy.wait("@updateTheme");

    cy.get("[data-test=logo] path").should("not.have.stroke", LOGO);

    cy.contains("Log out").click();
    cy.contains("Log in").click();
    cy.waitForFormInteractive(); // Needed because login link is rel='external' while we're migrating to allow access to the old site
    cy.get("[data-test=username]").type("shiny_colours");
    cy.get("[data-test=password]").type("abc123");
    cy.get("[data-test=submit]").click();

    cy.get("nav a").should("have.color", ACCENT_DARK);
    cy.assertLogoRotates();

    cy.get("[data-test=settings-cog]").click();
    cy.get("[data-test=select-theme] [data-test=select-box]").select("default");
    cy.get("[data-test=select-calendar-day] [data-test=select-box] option:selected").should("have.text", "Tuesday");
    cy.get("[data-test=confirm-theme]").click();
    cy.get("[data-test=icon-close]").click();
    cy.wait("@updateTheme");

    cy.get("nav a").should("have.color", ACCENT_LIGHT);
    cy.get("[data-test=logo] path").should("have.stroke", LOGO);
    cy.assertLogoRotates();
  });
});
