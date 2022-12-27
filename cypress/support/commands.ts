import "@percy/cypress";
import { DateTime } from "luxon";
import { Email } from "./proxies";

declare global {
  namespace Cypress {
    interface Cypress {
      DateTime: typeof DateTime;
    }
    interface Chainable<Subject> {
      login(username: string, password: string, options?: Partial<RequestOptions>): void;
      loginWithoutCySession(username: string, password: string, options?: Partial<RequestOptions>): void;
      searchEmails(limit?: number, start?: number): Chainable<{ items: Email[] }>;
      clickLink(options?: Partial<VisitOptions>): Chainable<AUTWindow>;
      checkFileExists(filename: string): Chainable<boolean>;
      removeFile(filepath: string): void;
      cssProperty(name: string): Chainable<string>;
      hasTooltip(content: string): void;
      tooltipContents(): Chainable<string>;
      tooltipInnerHTML(): Chainable<string>;
      paste(content: string): void;
      waitForFormInteractive(): void;
      toggleLineupRole(name: string): void;
      toggleLineupRole(userId: number, name: string): void;
      approveLineupPerson(userId: number): void;
      assertLogoRotates(): void;
      assertLogoDoesntRotate(): void;
      selectNextMonth(): void;
      selectPreviousMonth(): void;
      // From cypress-plugin-tab
      tab(): Chainable<Subject>;
    }

    interface Chainer<Subject> {
      (chainer: "be.sentTo", sentTo: string): Chainable<Subject>;
      (chainer: "have.atttr", name: string): Chainable<string>;
    }
  }

  namespace Chai {
    interface Assertion {
      sentTo(email: string): void;
      // From chai-sorted
      sorted(): void;
      ascending: Assertion;
    }
  }
}

Cypress.Commands.add("login", (username, password, options) =>
  cy.session(
    [username, password],
    () => {
      cy.request({
        method: "POST",
        url: "/auth/login", // baseUrl is prepended to url
        form: true, // indicates the body should be form urlencoded and sets Content-Type: application/x-www-form-urlencoded headers
        body: {
          username,
          password,
        },
        ...options,
      });
      cy.request({ method: "GET", url: "/auth/hook", headers: { "x-hasura-role": "current_user" } });
    },
    {
      validate() {
        cy.request({ method: "GET", url: "/auth/hook", headers: { "x-hasura-role": "current_user" } });
      },
    },
  ),
);

Cypress.Commands.add("loginWithoutCySession", (username, password, options = {}) =>
  cy
    .request({
      method: "POST",
      url: "/auth/login", // baseUrl is prepended to url
      form: true, // indicates the body should be form urlencoded and sets Content-Type: application/x-www-form-urlencoded headers
      body: {
        username,
        password,
      },
      ...options,
    })
    .its("body")
    .its("type")
    .should("not.equal", "error"),
);

Cypress.Commands.add("searchEmails", (limit = 1, start = 0) => {
  cy.request(`${Cypress.env("MAILHOG_HOST")}/api/v2/messages?limit=${limit}&start=${start}`)
    .its("body")
    .then((response) => ({ ...response, items: response.items.map((item) => Email(item)) }));
});
// Click a link so cypress checks the response status code
Cypress.Commands.add(
  "clickLink",
  {
    prevSubject: "element",
  },
  // @ts-ignore - expected to be called on a tags
  (subject, options = {}) => cy.visit({ ...options, url: subject[0].href }),
);

Cypress.Commands.add("checkFileExists", (filename) => {
  // `cat` returns a non-zero exit status if the file doesn't exist
  cy.exec(`cat ${filename}`, { log: false }).its("code", { log: false }).should("eq", 0);
  Cypress.log({
    message: filename,
    name: "checkFileExists",
    displayName: "fileExists",
  });
});

Cypress.Commands.add("removeFile", (filepath) => {
  cy.exec(`rm ${filepath}`, { log: false });
  Cypress.log({
    message: filepath,
    name: "removeFile",
    displayName: "removeFile",
  });
});

Cypress.Commands.add("cssProperty", (name) =>
  cy
    .document()
    .its("documentElement")
    .then((elem) => getComputedStyle(elem))
    .invoke("getPropertyValue", name)
    .invoke("trim")
    .should("not.equal", undefined),
);

Cypress.Commands.add("hasTooltip", { prevSubject: "element" }, (subject, content) => {
  cy.get("[data-test=tooltip-loaded]").should("exist");
  cy.wrap(subject).focus();
  cy.get("[data-test='tooltip']").contains(content).should("be.visible");
  cy.wrap(subject).blur();
});

Cypress.Commands.add("tooltipContents", { prevSubject: true }, (subject) => {
  cy.get("[data-test=tooltip-loaded]").should("exist");
  cy.wrap(subject).focus();
  cy.get("[data-test='tooltip']")
    .first()
    .invoke("text")
    .then((text) => {
      cy.wrap(subject).blur();
      cy.wrap(text);
    });
});

Cypress.Commands.add("tooltipInnerHTML", { prevSubject: true }, (subject) => {
  cy.get("[data-test=tooltip-loaded]").should("exist");
  cy.wrap(subject).focus();
  cy.get("[data-test='tooltip']")
    .first()
    .invoke("html")
    .then((text) => {
      cy.wrap(subject).blur();
      cy.wrap(text);
    });
});

Cypress.Commands.add("paste", { prevSubject: true }, (subject, content) => {
  cy.wrap(subject).focus().invoke("val", content).trigger("input");
});

Cypress.Commands.add("waitForFormInteractive", () => {
  cy.get("[data-test=page-hydrated]", { timeout: 10000 }).should("exist");
});

function parseBool(b: string): boolean {
  if (b === "true") return true;
  else if (b === "false") return false;
  else throw new TypeError(`Expected ${b} to be a bool value`);
}

Cypress.Commands.add("toggleLineupRole", (...args) => {
  const [userId, name] = args.length == 2 ? args : [undefined, args[0]];
  const userRow = userId ? `[data-test=member-${userId}]` : ``;
  const button = `${userRow} [data-test=toggle-${name}]`;
  cy.get(button)
    .invoke("attr", "aria-pressed")
    // @ts-ignore
    .then(parseBool)
    .then((previousPressedState) => {
      cy.get(button).click();
      cy.get(button).should("have.attr", "aria-pressed", (!previousPressedState).toString());
    });
});

Cypress.Commands.add("approveLineupPerson", (userId) => {
  cy.get(`[data-test=member-${userId}] [data-test=person-approve]`).click().should("not.exist");
});
