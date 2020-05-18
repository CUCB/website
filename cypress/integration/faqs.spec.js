describe("FAQs pages", () => {
    it("returns a 404 status when the page doesn't exist", () => {
        cy.request({
            url: "/faqs/something-completely-made-up",
            failOnStatusCode: false
        }).should((response) =>
            expect(response.status).to.eq(404));
    });

    it("returns a 200 status when the page does exist", () => {
        cy.visit("/faqs/members");
    });
});
