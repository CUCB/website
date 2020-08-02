import { CreateUser, HASHED_PASSWORDS } from "../database/users";
import { AddCommittee } from "../database/committee";

describe("header", () => {
  before(() => cy.visit("/"));

  describe("navbar", () => {
    it("navigates to /book", () => {
      cy.get("header nav a")
        .contains("book us")
        .clickLink();
      cy.url().should("include", "/book");
    });

    it("navigates to /join", () => {
      cy.get("header nav a")
        .contains("join us")
        .clickLink();
      cy.url().should("include", "/join");
    });

    it("navigates to /committee", () => {
      cy.executeMutation(AddCommittee, {
        variables: {
          id: 57434,
          started: "1970-01-01T01:00Z",
          data: {
            on_conflict: { constraint: "cucb_committee_members_id_key", update_columns: ["position", "name"] },
            data: [
              {
                id: 17547,
                position: 1,
                name: "Leady Lead",
                casual_name: "Leady",
                lookup_name: 1,
              },
            ],
          },
        },
      });
      cy.get("header nav a")
        .contains("committee")
        .clickLink();
      cy.url().should("include", "/committee");
    });

    context("when not logged in", () => {
      it("doesn't navigate to /members", () => {
        cy.get("header nav a")
          .contains("members")
          .should("not.exist");
      });

      it("navigates to login page", () => {
        cy.get("header nav a")
          .contains("log in")
          .clickLink();
      });
    });

    context("when logged in", () => {
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

      beforeEach(() => {
        cy.login("cypress_user", "abc123");
        cy.visit("/");
      });

      it("navigates to /members", () => {
        cy.get("header nav a")
          .contains("members")
          .clickLink();
        cy.url().should("include", "members");
      });

      it("contains working logout button", () => {
        cy.get("header nav a")
          .contains("log out")
          .clickLink();
        cy.get("header nav a")
          .contains("members")
          .should("not.exist");
      });
    });
  });

  it("shows the logo", () => {
    cy.get("header [data-test='logo']").should("be.visible");
  });
});
