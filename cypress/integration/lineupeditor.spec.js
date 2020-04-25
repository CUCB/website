describe("CUCB lineup editor", () => {
    before(() => {
        cy.executeSqlFile('cypress/fixtures/create_webmaster.sql');
        cy.executeSqlFile('cypress/fixtures/create_user.sql');
        cy.executeSqlFile('cypress/fixtures/add_gig.sql');
    });

    context("authorized as webmaster", () => {
        beforeEach(() => cy.login("cypress", "abc123"));

        it("has the correct gig title on the page", () => {
            cy.visit("/gigs/1/lineup-editor");
            cy.contains("h2", "Cypress Demo Gig");
        });

        it("gives a 404 error when the gig doesn't exist", () => {
            cy.request({
                url: "/gigs/2/lineup-editor",
                failOnStatusCode: false
            }).should((response) =>
                expect(response.status).to.eq(404));
        });
    });

    it("isn't accessible to when not logged in", () => {
        cy.request({
            url: "/gigs/1/lineup-editor",
            failOnStatusCode: false
        }).should((response) =>
            expect(response.status).to.eq(401));
    });

    it("isn't accessible to an ordinary user", () => {
        cy.login("cypress_user", "abc123");
        cy.request({
            url: "/gigs/1/lineup-editor",
            failOnStatusCode: false
        }).should((response) =>
                expect(response.status).to.eq(403));
    });
});
