// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add("login", (username, password) =>
    cy.request({
        method: 'POST',
        url: '/auth/login', // baseUrl is prepended to url
        form: true, // indicates the body should be form urlencoded and sets Content-Type: application/x-www-form-urlencoded headers
        body: {
            username,
            password
        }
    })
)

Cypress.Commands.add("executeSqlFile", (filename) =>
    cy.exec(`bash -c 'PGPASSWORD=${Cypress.env('PG_PASSWORD')} psql -h ${Cypress.env('PG_HOST')} -U ${Cypress.env('PG_USER')} -d ${Cypress.env('PG_DATABASE')} -f ${filename}'`)
)
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
