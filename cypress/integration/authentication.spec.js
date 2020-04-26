describe("login page", () => {
    let polyfill;

    before(() => {
        cy.executeSqlFile("cypress/database/users/new_user.sql");
        cy.fetchPolyfill().then(result => polyfill = result);
    });

    beforeEach(() => {
        cy.visit("/auth/login", {
            onBeforeLoad(win) {
                delete win.fetch
                win.eval(polyfill)
                win.fetch = win.unfetch
            },
        });
    });

    it("greets with sign in", () => {
        cy.get("h1").contains("Sign in")
    });

    it("links to register page", () => {
        // TODO uncomment this when the register page is created
        //cy.get("a[data-test=register]").clickLink();
    });

    describe("form", () => {
        beforeEach(() =>
            Cypress.currentTest.retries(3) // Retry the test if it fails as svelte inputs are a bit flaky
        );

        it("accepts a valid username and password", () => {
            cy.get("input[data-test=username]").type("cypress_user");
            cy.get("input[data-test=password]").type("abc123");
            cy.get("input[data-test=submit]").click();
            cy.url().should("match", /\/members/);
        });

        it("submits on pressing enter", () => {
            cy.server();
            cy.route("POST", "/auth/login").as("postLogin");
            cy.get("input[data-test=username]").type("cypress_user");
            cy.get("input[data-test=password]").type("abc123{enter}");
            cy.wait("@postLogin", { timeout: 50 });
        });


        it("shows an error on incorrect username/password", () => {
            cy.get("input[data-test=username]").type("cypress_user");
            cy.get("input[data-test=password]").type("abc1e23{enter}");
            cy.get("[data-test=errors]").contains("Incorrect username or password", { timeout: 100 });

            cy.get("input[data-test=username]").clear().type("cypres_user");
            cy.get("input[data-test=password]").clear().type("abc123{enter}");
            cy.get("[data-test=errors]").contains("Incorrect username or password", { timeout: 100 });
        });

        it("shows an error on missing username/password", () => {
            cy.get("input[data-test=password]").type("abc123{enter}");
            cy.get("[data-test=errors]").contains("Missing username or password", { timeout: 100 });

            cy.get("input[data-test=username]").type("cypress_user");
            cy.get("input[data-test=password]").clear().type("{enter}");
            cy.get("[data-test=errors]").contains("Missing username or password", { timeout: 100 });
        });
    });
});
