import {
  CreateUser,
  DeleteUsersWhere,
  AppendToList042,
  DeleteFromList042,
  UserWithUsername,
  HASHED_PASSWORDS,
} from "../database/users";

describe("login page", () => {
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
    cy.visit("/auth/login");
  });

  it("greets with sign in", () => {
    cy.get("h1").contains("Sign in");
  });

  it("links to register page", () => {
    cy.get("a[data-test=register]").clickLink();
  });

  describe("form", () => {
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
      .its("status")
      .should("eq", 401);
  });
});

describe("registration form", () => {
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
    cy.executeMutation(DeleteUsersWhere, {
      variables: { where: { _or: [{ username: { _ilike: "%cy-register%" } }, { username: { _ilike: "cy456%" } }] } },
    });
    cy.executeMutation(DeleteFromList042, { variables: { where: { email: { _ilike: "%cy-register%" } } } });
    cy.executeMutation(AppendToList042, {
      variables: {
        objects: ["nonuni@cy-register.test", "cy456@cam.ac.uk", "cypress.user@cypress.io"].map((email) => ({
          email,
        })),
      },
    });
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
    cy.executeQuery(UserWithUsername, { variables: { username: "cy456" } })
      .its("cucb_users")
      .should("have.length", 1);
    cy.executeMutation(DeleteUsersWhere, { variables: { where: { username: { _eq: "cy456" } } } });

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
    cy.executeQuery(UserWithUsername, { variables: { username: "cy456" } })
      .its("cucb_users")
      .should("have.length", 1);
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
    cy.executeQuery(UserWithUsername, { variables: { username: "cy456" } })
      .its("cucb_users")
      .should("have.length", 1);
  });
});

describe("registration page", () => {
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

  it("can't be accessed by logged in users", () => {
    cy.login("cypress_user", "abc123");
    cy.visit("/auth/register");
    cy.url().should("contain", "/members").and("not.contain", "/auth");
  });
});

describe("password reset form", () => {
  before(() => {
    cy.executeMutation(CreateUser, {
      variables: {
        id: 50000,
        username: "pass2",
        saltedPassword: "$2y$10$e2NuZ7jmxhI33TuD9gjWMevohZOWtRCTUzKOz7cqLqKd80DCCG.iu", // "password"
        admin: 1,
        email: "password.user0@cypress.io",
        firstName: "Password",
        lastName: "User",
      },
    });
  });
  it("can't be accessed by logged in users", () => {
    cy.login("cypress_user", "abc123");
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
        expect(email).to.be.sentTo("password.user0@cypress.io");
        expect(email.replyTo).to.contain("CUCB Webmaster <webmaster@cucb.co.uk>");
        console.log(email)
        cy.visit(`/renderemail?id=${email.ID}`)
      });
      cy.get("a").should("have.attr", "href").and("match", /^https:\/\/www.cucb.co.uk\/auth\/reset-password/).then(link => {
          link = link.replace(/^https:\/\/www.cucb.co.uk/, Cypress.config().baseUrl)
          cy.visit(link);
      });
  });
});
