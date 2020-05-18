describe("FAQs pages", () => {
    it("returns a 404 status when the page doesn't exist", () => {
        cy.request({
            url: "/faqs/something-completely-made-up",
            failOnStatusCode: false
        })
            .its('status')
            .should('be', 404);
    });

    it("returns a 200 status when the page does exist", () => {
        cy.visit("/faqs/members");
    });

    describe("caching", () => {
        it("creates cached_content dir if not exists", () => {
            cy.exec(`rm -rf cached_content`);
            cy.visit(`/faqs/members`);
            cy.checkFileExists(`cached_content/faqs/members.html`);
        });

        it("overwrites cache file if it exists and is invalid", () => {
            cy.writeFile('content/faqs/tests.md', 'Old content');
            cy.visit(`/faqs/tests`);
            cy.checkFileExists(`cached_content/faqs/tests.html`);

            cy.writeFile('content/faqs/tests.md', 'New content');
            cy.visit(`/faqs/tests`);
            cy.readFile(`cached_content/faqs/tests.html`)
                .should('contain', 'New content')
                .should('not.contain', 'Old');

            // Cleanup
            cy.removeFile(`content/faqs/tests.md`);
            cy.removeFile(`cached_content/faqs/tests.html`);
        });

        it("reads cache if valid", () => {
            cy.writeFile('content/faqs/tests.md', 'MD content');
            cy.visit(`/faqs/tests`);
            cy.writeFile('cached_content/faqs/tests.html', '<p>Cached content</p>');
            cy.readFile('cached_content/faqs/tests.html')
                .should('contain', 'Cached content')
                .should('not.contain', 'MD');

            // Cleanup
            cy.removeFile(`content/faqs/tests.md`);
            cy.removeFile(`cached_content/faqs/tests.html`);
        });

        it("displays from up to date markdown", () => {
            cy.writeFile('content/faqs/tests.md', 'Shiny new up to date content');
            cy.visit(`/faqs/tests`);
            cy.get('main').should('contain', 'Shiny new up to date content');

            // Cleanup
            cy.removeFile(`content/faqs/tests.md`);
            cy.removeFile(`cached_content/faqs/tests.html`);
        });

        it("gives 404 error if cached content exists but source doesn't", () => {
            cy.writeFile('content/faqs/tests.md', 'Original content');
            cy.visit(`/faqs/tests`);
            cy.removeFile('content/faqs/tests.md');
            cy.request({ url: `/faqs/tests`, failOnStatusCode: false })
                .its('status')
                .should('be', 404);

            // Cleanup
            cy.removeFile(`cached_content/faqs/tests.html`);
        });
    });
});
