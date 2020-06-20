import { CreateGig } from "../../database/gigs";
import { CreateUser, HASHED_PASSWORDS } from "../../database/users";

describe("lineup editor", () => {
  before(() => {
    cy.executeMutation(CreateGig, {
      variables: {
        id: 15274,
        title: "Cypress Demo Gig",
        type: 1,
        adminsOnly: false,
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

    it("has the correct gig title on the page", () => {
      cy.visit("/members/gigs/15274/lineup-editor");
      cy.contains("h2", "Cypress Demo Gig");
    });

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
