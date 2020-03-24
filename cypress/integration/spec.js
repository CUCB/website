describe("CUCB homepage", () => {
    beforeEach(() => {
        cy.visit("/");
    });

    it("has the correct <h1>", () => {
        cy.contains("h1", "Welcome to CUCB!");
    });

	it("has a visible header", () => {
		cy.get("header")
			.should("be.visible");
	});

	it("should show the logo in the header", () => {
		cy.get("header img")
			.should("be.visible")
			.and(($img) => {
				expect($img[0].naturalWidth).to.be.greaterThan(0)
			});
	});

	it("has a visible navbar", () => {
		cy.get("header nav")
			.should("be.visible");
	});

    it("navigates to /about", () => {
        cy.get("header nav a")
            .contains("about")
            .click();
        cy.url().should("include", "/about");
    });

    it("navigates to /book", () => {
        cy.get("header nav a")
            .contains("book us")
            .click();
        cy.url().should("include", "/book");
    });

    it("navigates to /join", () => {
        cy.get("header nav a")
            .contains("join us")
            .click();
        cy.url().should("include", "/join");
	});
	
	it("has a visible footer", () => {
		cy.get("footer p")
			.should("be.visible");
	});

    it("diplays webmaster's email in the footer", () => {
        cy.get("footer a")
            .contains("Webmaster")
            .should("have.attr", "href")
            .and("include", "mailto:webmaster@cucb.co.uk");
    });

    it("diplays secretary's email in the footer", () => {
        cy.get("footer a")
            .contains("Secretary")
            .should("have.attr", "href")
            .and("include", "mailto:secretary@cucb.co.uk");
	});
});
