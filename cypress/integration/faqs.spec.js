describe("FAQs pages", () => {
  it("returns a 404 status when the page doesn't exist", () => {
    cy.request({
      url: "/faqs/something-completely-made-up",
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 404);
  });

  it("returns a 200 status when the page does exist", () => {
    cy.visit("/faqs/members");
  });

  describe("Booking FAQs", () => {
    before(() => cy.visit("/faqs/book"));

    it("includes the title", () => {
      cy.contains("h1", "Frequently Asked Questions");
    });

    it("has an appropriate subheading", () => {
      cy.contains("h2", "Book");
    });

    it("has an FAQ", () => {
      cy.contains("h3", "?");
    });
  });

  describe("Joining FAQs", () => {
    before(() => cy.visit("/faqs/join"));

    it("includes the title", () => {
      cy.contains("h1", "Frequently Asked Questions");
    });

    it("has an appropriate subheading", () => {
      cy.contains("h2", "Join");
    });

    it("has an FAQ", () => {
      cy.contains("h3", "?");
    });
  });
});
