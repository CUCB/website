import { CreateUser, HASHED_PASSWORDS } from "../../database/users";

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
});
