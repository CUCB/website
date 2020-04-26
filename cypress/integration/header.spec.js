describe("header", () => {
    beforeEach(() => cy.visit("/"));

    describe("navbar", () => {
        it("navigates to /about", () => {
            cy.get("header nav a")
                .contains("about")
                .clickLink();
            cy.url().should("include", "/about");
        });

        it("navigates to /book", () => {
            cy.get("header nav a")
                .contains("book us")
                .clickLink();
            cy.url().should("include", "/book");
        });

        it("navigates to /join", () => {
            cy.get("header nav a")
                .contains("join us")
                .clickLink();
            cy.url().should("include", "/join");
        });
    });

    it("shows the logo", () => {
        cy.get("header img")
            .should("be.visible")
            .and(($img) => {
                expect($img[0].naturalWidth).to.be.greaterThan(0)
            });
    });
});
