describe("lineup editor", () => {
    before(() => {
        cy.executeSqlFile('cypress/database/users/new_webmaster.sql');
        cy.executeSqlFile('cypress/database/users/new_user.sql');
        cy.executeSqlFile('cypress/database/gigs/new_gig.sql');
    });

    context("authorized as webmaster", () => {
        beforeEach(() => cy.login("cypress", "abc123"));

        it("has the correct gig title on the page", () => {
            cy.visit("/members/gigs/15274/lineup-editor");
            cy.contains("h2", "Cypress Demo Gig");
        });

        it("gives a 404 error when the gig doesn't exist", () => {
            cy.request({
                url: "/members/gigs/15275/lineup-editor",
                failOnStatusCode: false
            }).should((response) =>
                expect(response.status).to.eq(404));
        });
    });

    context("not logged in", () => {
        it("isn't accessible", () => {
            cy.request({
                url: "/members/gigs/15274/lineup-editor",
                failOnStatusCode: false
            }).should((response) =>
                expect(response.status).to.eq(401));
        });

        it("shows correct error on non existent gig", () => {
            cy.request({
                url: "/members/gigs/15275/lineup-editor",
                failOnStatusCode: false
            }).should((response) =>
                expect(response.status).to.eq(401));
        });
    });

    context("authorized as normal user", () => {
        it("isn't accessible", () => {
            cy.login("cypress_user", "abc123");
            cy.request({
                url: "/members/gigs/15274/lineup-editor",
                failOnStatusCode: false
            }).should((response) =>
                expect(response.status).to.eq(403));
        });
    });
});
