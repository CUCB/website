import "@percy/cypress";
import "cypress-pipe";
import { Email } from "./proxies";

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

Cypress.Commands.add("loginWithoutCySession", (username, password, options) =>
  cy.request({
    method: "POST",
    url: "/auth/login", // baseUrl is prepended to url
    form: true, // indicates the body should be form urlencoded and sets Content-Type: application/x-www-form-urlencoded headers
    body: {
      username,
      password,
    },
    ...options,
  }),
);

Cypress.Commands.add("executeMutation", (mutation, params) =>
  cy
    .request({
      url: `${Cypress.env("GRAPHQL_REMOTE")}${Cypress.env("GRAPHQL_PATH")}`,
      headers: {
        "x-hasura-admin-secret": Cypress.env("HASURA_GRAPHQL_ADMIN_SECRET"),
      },
      body: {
        query: mutation,
        ...params,
      },
      method: "POST",
    })
    .its("body")
    .should("not.have.key", "errors"),
);

Cypress.Commands.add("executeQuery", (mutation, params) => cy.executeMutation(mutation, params).its("data"));

Cypress.Commands.add("searchEmails", (limit = 1, start = 0) => {
  cy.request(`${Cypress.env("MAILHOG_HOST")}/api/v2/messages?limit=${limit}&start=${start}`)
    .its("body")
    .then((response) => ({ ...response, items: response.items.map((item) => Email(item)) }));
});
// Click a link so cypress checks the response status code
Cypress.Commands.add(
  "clickLink",
  {
    prevSubject: true,
  },
  (subject, options) => cy.visit({ ...options, url: subject[0].href }),
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
    .pipe((elem) => getComputedStyle(elem[0]))
    .invoke("getPropertyValue", name)
    .invoke("trim")
    .should("not.equal", undefined),
);

Cypress.Commands.add("hasTooltip", { prevSubject: true }, (subject, content) => {
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

Cypress.Commands.add("paste", { prevSubject: true }, (subject, content) => {
  cy.wrap(subject).focus().invoke("val", content).trigger("input");
});

Cypress.Commands.add("waitForFormInteractive", () => {
  cy.get("[data-test=page-hydrated]").should("exist");
});

function parseBool(b) {
  if (b === "true") return true;
  else if (b === "false") return false;
  else throw new Exception(`Expected ${b} to be a bool value`);
}

Cypress.Commands.add("toggleLineupRole", (...args) => {
  const [userId, name] = args.length == 2 ? args : [undefined, args[0]];
  const userRow = userId ? `[data-test=member-${userId}]` : ``;
  const button = `${userRow} [data-test=toggle-${name}]`;
  cy.get(button)
    .invoke("attr", "aria-pressed")
    .then(parseBool)
    .then((previousPressedState) => {
      cy.get(button).click();
      cy.get(button).should("have.attr", "aria-pressed", (!previousPressedState).toString());
    });
});

Cypress.Commands.add("approveLineupPerson", (userId) => {
  cy.get(`[data-test=member-${userId}] [data-test=person-approve]`).click().should("not.exist");
});
