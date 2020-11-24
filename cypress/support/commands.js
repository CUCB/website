import "@percy/cypress";
import "cypress-pipe";
import { Email } from "./proxies";

Cypress.Commands.add("login", (username, password, options) =>
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
    .then(response => ({ ...response, items: response.items.map(item => Email(item)) }));
});
// Click a link so cypress checks the response status code
Cypress.Commands.add(
  "clickLink",
  {
    prevSubject: true,
  },
  (subject, options) => cy.visit({ ...options, url: subject[0].href }),
);

Cypress.Commands.add("checkFileExists", filename => {
  // `cat` returns a non-zero exit status if the file doesn't exist
  cy.exec(`cat ${filename}`, { log: false })
    .its("code", { log: false })
    .should("eq", 0);
  Cypress.log({
    message: filename,
    name: "checkFileExists",
    displayName: "fileExists",
  });
});

Cypress.Commands.add("removeFile", filepath => {
  cy.exec(`rm ${filepath}`, { log: false });
  Cypress.log({
    message: filepath,
    name: "removeFile",
    displayName: "removeFile",
  });
});

Cypress.Commands.add("cssProperty", name =>
  cy
    .document()
    .its("documentElement")
    .pipe(elem => getComputedStyle(elem[0]))
    .invoke("getPropertyValue", name)
    .invoke("trim")
    .should("not.equal", undefined),
);

Cypress.Commands.add("hasTooltip", { prevSubject: true }, (subject, content) => {
  cy.wrap(subject).trigger("mouseleave");
  cy.wrap(subject).trigger("mouseenter");
  cy.get("[data-test='tooltip']")
    .contains(content)
    .should("be.visible");
});
