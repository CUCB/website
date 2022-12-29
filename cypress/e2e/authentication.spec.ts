/// <reference types="Cypress" />

import jwt from "jsonwebtoken";

describe("login page", () => {
  before(() => {
    cy.task("db:create_login_users");
  });

  beforeEach(() => {
    cy.visit("/auth/login");
  });

  it("greets with sign in", () => {
    cy.get("h1").contains("Sign in");
  });

  it("links to register page", () => {
    cy.get("a[data-test=register]").clickLink();
  });

  describe("form", () => {
    beforeEach(() => {
      cy.waitForFormInteractive();
    });

    it("accepts a correct username/password combination", () => {
      cy.get("input[data-test=username]").type("cypress_user");
      cy.get("input[data-test=password]").type("abc123");
      cy.get("input[data-test=submit]").click();
      cy.url().should("match", /\/members/);
    });

    it("uses a case-insensitive match for username", () => {
      cy.get("input[data-test=username]").type("CYPRESS_USER");
      cy.get("input[data-test=password]").type("abc123");
      cy.get("input[data-test=submit]").click();
      cy.url().should("match", /\/members/);
    });

    it("submits on pressing enter", () => {
      cy.intercept({
        method: "POST",
        url: "/auth/login",
      }).as("postLogin");
      cy.get("input[data-test=username]").type("cypress_user");
      cy.get("input[data-test=password]").type("abc123{enter}");
      cy.wait("@postLogin");
    });

    it("shows an error on incorrect username/password", () => {
      cy.get("input[data-test=username]").type("cypress_user");
      cy.get("input[data-test=password]").type("abc1e23{enter}");
      cy.get("[data-test=errors]").contains("Incorrect username or password");

      cy.get("input[data-test=username]").clear().type("cypres_user");
      cy.get("input[data-test=password]").clear().type("abc123{enter}");
      cy.get("[data-test=errors]").contains("Incorrect username or password");
    });

    it("shows an error on missing username/password", () => {
      cy.get("input[data-test=password]").type("abc123{enter}");
      cy.get("[data-test=errors]").contains("Missing username or password");

      cy.get("input[data-test=username]").type("cypress_user");
      cy.get("input[data-test=password]").clear().type("{enter}");
      cy.get("[data-test=errors]").contains("Missing username or password");
    });
  });
});

describe("password verification", () => {
  before(() => {
    cy.task("db:create_custom_users", [
      {
        id: "50000",
        username: "password_user_0",
        saltedPassword: "$2y$10$e2NuZ7jmxhI33TuD9gjWMevohZOWtRCTUzKOz7cqLqKd80DCCG.iu", // "password"
        admin: "1",
        email: "password.user0@cypress.io",
        first: "Password",
        last: "User",
      },
      {
        id: "50001",
        username: "password_user_1",
        saltedPassword: "$2y$10$m2SxZYfxU1BefSWFGCfvi.Lkv0svrm4YX7qGvJl6csY7IkOM0yV3W", // "password"
        admin: "1",
        email: "password.user1@cypress.io",
        first: "Password",
        last: "User",
      },
      {
        id: "50002",
        username: "password_user_2",
        saltedPassword: "$2y$10$YWGYgXuS0nbgA63MvRSTn.NiibtaBRUqRzN6HrvJHSOFD9C6t0id.", // "iloveceilidhband"
        admin: "1",
        email: "password.user2@cypress.io",
        first: "Password",
        last: "User",
      },
      {
        id: "50003",
        username: "password_user_3",
        saltedPassword: "$2y$12$ZEx7rY3a15Fl9TIR5feygOrnZ8.woJy58tBn7SixUFOMeuBk0.bec", // bogus hash - just made up
        admin: "1",
        email: "password.user3@cypress.io",
        first: "Password",
        last: "User",
      },
    ]);
  });

  it("accepts correct passwords with 2y prefix", () => {
    cy.request({
      method: "POST",
      url: "/auth/login",
      body: { username: "password_user_0", password: "password" },
      form: true,
    });
    cy.visit("/members"); // Check login actually worked once
    cy.visit("/auth/logout");
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
      .its("body.status")
      .should("eq", 401);
  });
});

describe("registration form", () => {
  before(() => {
    cy.task("db:create_login_users");
    cy.task("db:delete_users_where", {
      $or: [{ username: { $like: "%cy-register%" } }, { username: { $like: "cy456%" } }],
    });
    cy.task("db:delete_from_list042", { email: { $like: "%cy-register%" } });
    cy.task("db:append_to_list042", ["nonuni@cy-register.test", "cy456@cam.ac.uk", "cypress.user@cypress.io"]);
  });

  beforeEach(() => {
    cy.visit("/auth/register");
    cy.waitForFormInteractive();
  });

  it("has a title", () => {
    cy.contains("Create an account").should("be.visible");
  });

  it("has a link to sign up to the mailing list", () => {
    cy.get("a[data-test='mailinglists']").clickLink();
  });

  it("accepts valid CRSids and email addresses", () => {
    cy.get("[data-test=username]").click();
    cy.get("[data-test=username]").type("ab1234");
    cy.get("[data-test=username]:invalid").should("have.length", 0);
    cy.get("[data-test=username]").clear().type("xyz44");
    cy.get("[data-test=username]:invalid").should("have.length", 0);
    cy.get("[data-test=username]").clear().type("someone@valid.email");
    cy.get("[data-test=username]:invalid").should("have.length", 0);
    cy.get("[data-test=username]").clear().type("abc22@cam.ac.uk");
    cy.get("[data-test=username]:invalid").should("have.length", 0);
    cy.get("[data-test=username]").clear().type("XYZ527");
    cy.get("[data-test=username]:invalid").should("have.length", 0);
    cy.get("[data-test=username]").clear().type("AxBc57");
    cy.get("[data-test=username]:invalid").should("have.length", 0);
  });

  it("rejects invalid CRSids and email addresses", () => {
    cy.get("[data-test=username]:invalid").should("have.length", 1);
    cy.get("[data-test=username]").clear().type("someone@");
    cy.get("[data-test=username]:invalid").should("have.length", 1);
    cy.get("[data-test=username]").clear().type("@notanemailjustatwitterhandle");
    cy.get("[data-test=username]:invalid").should("have.length", 1);
    cy.get("[data-test=username]").clear().type("abc25b");
    cy.get("[data-test=username]:invalid").should("have.length", 1);
    cy.get("[data-test=username]").clear().type("XYZ");
    cy.get("[data-test=username]:invalid").should("have.length", 1);
  });

  it("rejects signups from emails that aren't on the mailing list", () => {
    cy.get("[data-test=first-name]").click();
    cy.get("[data-test=first-name]").type("Cypress");
    cy.get("[data-test=last-name]").click();
    cy.get("[data-test=last-name]").type("RegistrationUser");
    cy.get("[data-test=username]").click();
    cy.get("[data-test=username]").type("notonthelist@cy-register.test");
    cy.get("[data-test=password]").click();
    cy.get("[data-test=password]").type("areallysecurepassword");
    cy.get("[data-test=password-confirm]").type("areallysecurepassword");
    cy.get("[type=submit]").click();
    cy.get("[data-test=error]").contains("mailing list").should("be.visible");
  });

  it("rejects signups if the provided passwords are not the same", () => {
    cy.get("[data-test=first-name]").type("Cypress");
    cy.get("[data-test=last-name]").type("RegistrationUser");
    cy.get("[data-test=username]").type("cy456");
    cy.get("[data-test=password]").type("areallysecurepassword");
    cy.get("[data-test=password-confirm]").type("adifferentreallysecurepassword");
    cy.get("[type=submit]").click();
    cy.get("[data-test=password]:invalid").should("have.length", 1);
    cy.get("[data-test=password-confirm]:invalid").should("have.length", 1);
  });

  it("rejects passwords that are too short", () => {
    // See https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/minlength
    // "Constraint validation is only applied when the value is changed by the user"
    // So we can't check HTML validation with Cypress :(
    cy.get("[data-test=first-name]").click().type("Cypress");
    cy.get("[data-test=last-name]").click().type("RegistrationUser");
    cy.get("[data-test=username]").click().type("cy456");
    cy.get("[data-test=password]").click().type("short");
    cy.get("[data-test=password-confirm]").click().type("short");
    cy.get("[type=submit]").click();
    cy.get("[data-test=error]")
      .contains(/[Pp]assword/)
      .should("be.visible");
  });

  it("accepts CRSids and @cam.ac.uk addresses", () => {
    cy.intercept("POST", "/auth/register").as("register");
    cy.get("[data-test=first-name]").type("Cypress");
    cy.get("[data-test=last-name]").type("RegistrationUser");
    cy.get("[data-test=username]").type("cy456");
    cy.get("[data-test=password]").type("areallysecurepassword");
    cy.get("[data-test=password-confirm]").type("areallysecurepassword");
    cy.get("[type=submit]").click();
    cy.get("[data-test=error]").should("not.exist");
    cy.get("input:invalid").should("not.exist");
    cy.wait("@register").its("response.statusCode").should("eq", 200);
    cy.task("db:delete_users_where", { username: { $eq: "cy456" } });

    cy.request("POST", "/auth/logout");
    cy.visit("/auth/register");
    cy.waitForFormInteractive();
    cy.get("[data-test=first-name]").type("Cypress");
    cy.get("[data-test=last-name]").type("RegistrationUser");
    cy.get("[data-test=username]").type("cy456@cam.ac.uk");
    cy.get("[data-test=password]").type("areallysecurepassword");
    cy.get("[data-test=password-confirm]").type("areallysecurepassword");
    cy.get("[type=submit]").click();
    cy.get("[data-test=error]").should("not.exist");
    cy.get("input:invalid").should("not.exist");
    cy.wait("@register").its("response.statusCode").should("eq", 200);
  });

  it("gives a suitable error message if the username/email is already registered", () => {
    cy.get("[data-test=first-name]").type("Cypress");
    cy.get("[data-test=last-name]").type("User");
    cy.get("[data-test=username]").type("cypress.user@cypress.io");
    cy.get("[data-test=password]").type("areallylongpassword");
    cy.get("[data-test=password-confirm]").type("areallylongpassword");
    cy.get('[type="submit"]').click();
    cy.get("[data-test=error]")
      .contains(/already exists/)
      .should("be.visible");
    cy.get("[data-test=error] a[data-test=login]").clickLink();
  });

  it("ignores captilisation of usernames to prevent double registration", () => {
    cy.get("[data-test=first-name]").type("Cypress");
    cy.get("[data-test=last-name]").type("RegistrationUser");
    cy.get("[data-test=username]").type("cy456");
    cy.get("[data-test=password]").type("areallysecurepassword");
    cy.get("[data-test=password-confirm]").type("areallysecurepassword");
    cy.get("[type=submit]").click();
    cy.get("[data-test=error]").should("not.exist");
    cy.get("input:invalid").should("not.exist");

    cy.request("POST", "/auth/logout");
    cy.visit("/auth/register");
    cy.waitForFormInteractive();
    cy.get("[data-test=first-name]").type("Cypress");
    cy.get("[data-test=last-name]").type("RegistrationUser");
    cy.get("[data-test=username]").type("CY456");
    cy.get("[data-test=password]").type("areallysecurepassword");
    cy.get("[data-test=password-confirm]").type("areallysecurepassword");
    cy.get("[type=submit]").click();
    cy.get("[data-test=error]")
      .contains(/already exists/)
      .should("be.visible");
  });
});

describe("list042 editor", () => {
  before(() => {
    cy.task("db:create_login_users");
  });

  beforeEach(() => {
    cy.task("db:delete_from_list042", {});
  });

  it("can add single emails and crsids", () => {
    cy.login("cypress", "abc123");
    cy.visit("/members/list042");
    cy.waitForFormInteractive();
    cy.get("ul").contains("jar95@cam.ac.uk").should("not.exist");
    cy.get('[data-test="add-single"] > [name="email"]').type("jar95");
    cy.get('[data-test="add-single"] > [type="submit"]').click();
    cy.get(".success").should("have.text", "Successfully added jar95@cam.ac.uk to the list.");
    cy.get("li").contains("jar95@cam.ac.uk").should("be.visible");
    cy.get('[data-test="add-single"] > [name="email"]').type("jar95@cam.ac.uk");
    cy.get('[data-test="add-single"] > [type="submit"]').click();
    cy.contains("That email is already on the list.").should("be.visible");
  });

  it("can merge existing entries with a copy of the mailing list", () => {
    cy.login("cypress", "abc123");
    cy.visit("/members/list042");
    cy.waitForFormInteractive();
    cy.get('[data-test="merge-with-file"] > [name=file]').selectFile("cypress/fixtures/emails.txt");
    cy.get('[data-test="merge-with-file"] > [type="submit"]').click();
    cy.get('[data-test="merge-with-file"]').contains("Found 3 new emails.").should("be.visible");
    cy.get("ul").contains("abc123@cam.ac.uk").should("be.visible");
    cy.get("ul").contains("bcd234@cam.ac.uk").should("be.visible");
    cy.get('[data-test="merge-with-file"] > [name=file]').selectFile("cypress/fixtures/emails.txt");
    cy.get('[data-test="merge-with-file"] > [type="submit"]').click();
    cy.get('[data-test="merge-with-file"]').contains("Found 0 new emails.").should("be.visible");
    cy.get("ul").contains("abc123@cam.ac.uk").should("be.visible");
    cy.reload();
    cy.get("ul").contains("abc123@cam.ac.uk").should("be.visible");
    cy.get("ul").contains("bcd234@cam.ac.uk").should("be.visible");
    cy.get("ul").contains("someone@example.com").should("be.visible");
  });
});

describe("registration page", () => {
  before(() => {
    cy.task("db:create_login_users");
  });

  it("can't be accessed by logged in users", () => {
    cy.login("cypress_user", "abc123");
    cy.visit("/auth/register");
    cy.url().should("contain", "/members").and("not.contain", "/auth");
  });
});

describe("password reset form", () => {
  before(() => {
    cy.task("db:create_custom_users", [
      {
        id: 50000,
        username: "pass2",
        saltedPassword: "$2y$10$e2NuZ7jmxhI33TuD9gjWMevohZOWtRCTUzKOz7cqLqKd80DCCG.iu", // "password"
        admin: 1,
        email: "password.user0@cypress.io",
        first: "Password",
        last: "User",
      },
    ]);
  });
  it("can't be accessed by logged in users", () => {
    cy.loginWithoutCySession("cypress_user", "abc123");
    cy.visit("/auth/reset-password");
    cy.url().should("contain", "/members").and("not.contain", "/auth");
  });

  it("creates a valid password reset link", { browser: ["chromium", "chrome", "electron"] }, () => {
    cy.visit("/auth/reset-password");
    cy.waitForFormInteractive();
    cy.get("[data-test='username']").click().type("pass2");
    cy.get("[data-test='submit']").click();
    cy.contains("A pasword reset link has been generated and emailed to you.");
    cy.searchEmails(1)
      .its("items")
      .then((emails) => {
        const email = emails[0];
        cy.wrap(email).should("be.sentTo", "password.user0@cypress.io");
        cy.wrap(email.replyTo).should("contain", "CUCB Webmaster <webmaster@cucb.co.uk>");
        cy.visit(`/renderemail?id=${email.ID}`);
      });
    cy.get("a")
      .should("have.attr", "href")
      .and("match", /^https:\/\/www.cucb.co.uk\/auth\/reset-password/)
      // @ts-expect-error
      .then((link: string) => {
        link = link.replace(/^https:\/\/www.cucb.co.uk/, Cypress.config().baseUrl || "");
        const token = link.split(/=/)[1];
        const decoded = jwt.verify(token, Cypress.env("SESSION_SECRET"));
        expect(decoded)
          .to.haveOwnProperty("exp")
          .to.be.greaterThan(Cypress.DateTime.local().toSeconds())
          .and.be.lessThan(Cypress.DateTime.local().plus({ hours: 2 }).toSeconds());
        cy.visit(link);
      });
    cy.waitForFormInteractive();
    cy.get("[data-test=password]").type("anewpassword");
    cy.get("[data-test=password-confirm]").type("anewpassword");
    cy.get("[data-test=submit]").click();
    cy.get("[data-test=username]").type("pass2");
    cy.get("[data-test=password]").type("anewpasswor{enter}");
    cy.contains("Incorrect username or password").should("be.visible");
    cy.get("[data-test=password]").clear().type("anewpassword{enter}");
    cy.url().should("match", /\/members/);
  });

  // TODO check expired JWT, invalid JWT, mismatched passwords...
});
