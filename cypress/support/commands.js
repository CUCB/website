import '@percy/cypress';

Cypress.Commands.add("login", (username, password, options) =>
    cy.request({
        method: 'POST',
        url: '/auth/login', // baseUrl is prepended to url
        form: true, // indicates the body should be form urlencoded and sets Content-Type: application/x-www-form-urlencoded headers
        body: {
            username,
            password
        },
        ...options
    })
);

Cypress.Commands.add("executeSqlFile", (filename) =>
    cy.exec(`bash -c 'PGPASSWORD=${Cypress.env('PG_PASSWORD')} psql -h ${Cypress.env('PG_HOST')} -U ${Cypress.env('PG_USER')} -d ${Cypress.env('PG_DATABASE')} -f ${filename}'`)
);

// Open the fetch polyfill, which is required for stubbing responses to work
// This is required due to https://github.com/cypress-io/cypress/issues/95 not being resolved (yet)
Cypress.Commands.add("fetchPolyfill", () =>
    cy.readFile("cypress/deps/unfetch.umd.js")
);

// Click a link so cypress checks the response status code
Cypress.Commands.add("clickLink", {
    prevSubject: true
}, (subject, options) => cy.visit({ ...options, url: subject[0].href }));

Cypress.Commands.add("checkFileExists", (filename) => {
    // `cat` returns a non-zero exit status if the file doesn't exist
    cy.exec(`cat ${filename}`, { log: false })
        .its('code', { log: false })
        .should('eq', 0);
    Cypress.log({ message: filename, name: 'checkFileExists', displayName: 'fileExists' });
});

Cypress.Commands.add("removeFile", (filepath) => {
    cy.exec(`rm ${filepath}`, { log: false });
    Cypress.log({ message: filepath, name: 'removeFile', displayName: 'removeFile' })
});
