import { CreateUser, HASHED_PASSWORDS } from "../database/users";

describe("login page", () => {
  let polyfill;

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
    cy.fetchPolyfill().then(result => (polyfill = result));
  });

  beforeEach(() => {
    cy.visit("/auth/login", {
      onBeforeLoad(win) {
        delete win.fetch;
        win.eval(polyfill);
        win.fetch = win.unfetch;
      },
    });
  });

  it("greets with sign in", () => {
    cy.get("h1").contains("Sign in");
  });

  it("links to register page", () => {
    // TODO uncomment this when the register page is created (issue #15)
    //cy.get("a[data-test=register]").clickLink();
  });

  describe("form", () => {
    beforeEach(
      () => Cypress.currentTest.retries(3), // Retry the test if it fails as svelte inputs are a bit flaky
    );

    it("accepts a valid username and password", () => {
      cy.get("input[data-test=username]").type("cypress_user");
      cy.get("input[data-test=password]").type("abc123");
      cy.get("input[data-test=submit]").click();
      cy.url().should("match", /\/members/);
    });

    it("submits on pressing enter", () => {
      cy.server();
      cy.route("POST", "/auth/login").as("postLogin");
      cy.get("input[data-test=username]").type("cypress_user");
      cy.get("input[data-test=password]").type("abc123{enter}");
      cy.wait("@postLogin");
    });

    it("shows an error on incorrect username/password", () => {
      cy.get("input[data-test=username]").type("cypress_user");
      cy.get("input[data-test=password]").type("abc1e23{enter}");
      cy.get("[data-test=errors]").contains("Incorrect username or password");

      cy.get("input[data-test=username]")
        .clear()
        .type("cypres_user");
      cy.get("input[data-test=password]")
        .clear()
        .type("abc123{enter}");
      cy.get("[data-test=errors]").contains("Incorrect username or password");
    });

    it("shows an error on missing username/password", () => {
      cy.get("input[data-test=password]").type("abc123{enter}");
      cy.get("[data-test=errors]").contains("Missing username or password");

      cy.get("input[data-test=username]").type("cypress_user");
      cy.get("input[data-test=password]")
        .clear()
        .type("{enter}");
      cy.get("[data-test=errors]").contains("Missing username or password");
    });
  });
});

describe("password verification", () => {
  before(() => {
    cy.executeMutation(CreateUser, {
      variables: {
        id: 50000,
        username: "password_user_0",
        saltedPassword: "$2y$10$e2NuZ7jmxhI33TuD9gjWMevohZOWtRCTUzKOz7cqLqKd80DCCG.iu", // "password"
        admin: 1,
        email: "password.user0@cypress.io",
        firstName: "Password",
        lastName: "User",
      },
    });
    cy.executeMutation(CreateUser, {
      variables: {
        id: 50001,
        username: "password_user_1",
        saltedPassword: "$2y$10$m2SxZYfxU1BefSWFGCfvi.Lkv0svrm4YX7qGvJl6csY7IkOM0yV3W", // "password"
        admin: 1,
        email: "password.user1@cypress.io",
        firstName: "Password",
        lastName: "User",
      },
    });
    cy.executeMutation(CreateUser, {
      variables: {
        id: 50002,
        username: "password_user_2",
        saltedPassword: "$2y$10$YWGYgXuS0nbgA63MvRSTn.NiibtaBRUqRzN6HrvJHSOFD9C6t0id.", // "iloveceilidhband"
        admin: 1,
        email: "password.user2@cypress.io",
        firstName: "Password",
        lastName: "User",
      },
    });
    cy.executeMutation(CreateUser, {
      variables: {
        id: 50003,
        username: "password_user_3",
        saltedPassword: "$2y$12$ZEx7rY3a15Fl9TIR5feygOrnZ8.woJy58tBn7SixUFOMeuBk0.bec", // bogus hash - just made up
        admin: 1,
        email: "password.user3@cypress.io",
        firstName: "Password",
        lastName: "User",
      },
    });
  });

  it("correctly verifies correct passwords with 2y prefix", () => {
    cy.request({
      method: "POST",
      url: "/auth/login",
      body: { username: "password_user_0", password: "password" },
      form: true,
    });
    cy.visit("/members"); // Check login actually worked once
    cy.request("POST", "/auth/logout");
    cy.request({
      method: "POST",
      url: "/auth/login",
      body: { username: "password_user_1", password: "password" },
      form: true,
    });
    cy.request("POST", "/auth/logout");
    cy.request({
      method: "POST",
      url: "/auth/login",
      body: { username: "password_user_2", password: "iloveceilidhband" },
      form: true,
    });
    cy.request("POST", "/auth/logout");
  });

  it("rejects incorrect passwords with 2y prefix", () => {
    cy.request({
      method: "POST",
      url: "/auth/login",
      body: { username: "password_user_3", password: "iloveceilidhband" },
      failOnStatusCode: false,
      form: true,
    })
      .its("status")
      .should("eq", 401);
  });
});
