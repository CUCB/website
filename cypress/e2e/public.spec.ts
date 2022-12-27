function revisitBeforePage() {
  // We want to stay on the same page, but since the sessions feature was introduced,
  // we get redirected to about:blank between tests. Hitting back in the browser is
  // generally much faster than doing a full page load, and we're not editing data
  // so there's no benefit to repeatedly reloading the page in full.
  cy.url().then((url) => {
    if (url === "about:blank") {
      cy.go("back");
    }
  });
}

function visitOnce(url) {
  before(() => cy.visit(url));
  beforeEach(revisitBeforePage);
}

describe("homepage", () => {
  visitOnce("/");

  it("has the correct favicon", () => {
    cy.document()
      .its("head")
      .find('link[rel="icon"]')
      .should("have.attr", "href")
      // @ts-ignore
      .should((href: string) => {
        const url = new URL(href);
        expect(url.pathname).to.eq("/static/favicon.ico");
      });
  });

  it("has the correct <h1>", () => {
    cy.contains("h1", "Welcome to CUCB!");
  });

  it("has a visible header", () => {
    cy.get("header").should("be.visible");
  });

  it("has a visible navbar", () => {
    cy.get("header nav").should("be.visible");
  });

  it("has a link to our FB page", () => {
    cy.get("li a").contains("Facebook").should("have.prop", "href").and("include", "facebook.com/CUCeilidhBand");
  });

  it("has a visible footer", () => {
    cy.get("footer p").should("be.visible");
  });

  it("diplays webmaster's email in the footer", () => {
    cy.get("footer a[data-test=email_webmaster]")
      .should("have.attr", "href")
      .and("include", "mailto:webmaster@cucb.co.uk");
  });

  it("diplays secretary's email in the footer", () => {
    cy.get("footer a[data-test=email_secretary]")
      .should("have.attr", "href")
      .and("include", "mailto:secretary@cucb.co.uk");
  });

  it("shows dark theme correctly", () => {
    cy.viewport(1280, 1024);
    cy.visit("/?color=dark");
    cy.percySnapshot();
  });
});

describe("book us page", () => {
  beforeEach(() => {
    cy.visit("/book");
  });

  it("has testimonial", () => {
    cy.get(".testimonial").should("be.visible");
  });

  // TODO test that it picks the secretary email from the committee table by setting a custom secretary email
  it("allows a user to submit a booking request", { browser: ["chromium", "chrome", "electron"] }, () => {
    cy.waitForFormInteractive();
    cy.get("[data-test='booking-name']").click().type("Testy Test");
    cy.get("[data-test='booking-email']").click().type("testy@te.st");
    cy.get("[data-test='booking-message']").click().type("Some message about booking a ceilidh");
    cy.get("[data-test=hcaptcha] > iframe").then(($element) => {
      const $body = $element.contents().find("body");
      cy.wrap($body).find("#checkbox").click();
      cy.wrap($body).find("#checkbox[aria-checked=true]");
    });
    cy.get("[data-test='booking-send']").click();
    cy.contains("Your message has been sent to our secretary");
    cy.searchEmails(2)
      .its("items")
      .then((emails) => {
        let secEmail, clientEmail;
        if (emails[1]["To"][0]["Mailbox"] === "secretary") {
          secEmail = emails[1];
          clientEmail = emails[0];
        } else {
          secEmail = emails[0];
          clientEmail = emails[1];
        }
        expect(clientEmail).to.be.sentTo("testy@te.st");
        expect(clientEmail.body).to.contain("Dear Testy Test").and.contain("Some message about booking a ceilidh");
        expect(secEmail).to.be.sentTo("secretary@cucb.co.uk");
        expect(secEmail.replyTo).to.contain("Testy Test <testy@te.st>");
      });
  });

  it("prevents a user from submitting the booking form when not captcha'd", () => {
    cy.waitForFormInteractive();
    cy.intercept({
      method: "POST",
      url: "/contact",
    }).as("contact");
    cy.get("[data-test='booking-name']").click().type("Testy test");
    cy.get("[data-test='booking-email']").click().type("testy@te.st");
    cy.get("[data-test='booking-message']").click().type("testy test");
    cy.get("[data-test='booking-send']").click();
    cy.get(".error").contains("captcha");
    cy.cssProperty("--negative").then((color) => {
      cy.get(".error").should("have.color", color);
    });
  });
});

describe("sessions page", () => {
  visitOnce("/session");

  it("has a link to mailing lists", () => {
    cy.get("a").contains("mailing list").should("have.prop", "href").and("include", "/mailinglists");
  });
});

describe("join page", () => {
  before(() => {
    cy.visit("/join");
  });

  it("has a link to mailing list", () => {
    cy.get("p a").contains("mailing list").should("have.prop", "href").and("include", "/mailinglists/");
  });
});

describe("header", () => {
  visitOnce("/");

  describe("navbar", () => {
    it("navigates to /book", () => {
      cy.get("header nav a").contains("Book us").clickLink();
      cy.url().should("include", "/book");
    });

    it("navigates to /join", () => {
      cy.get("header nav a").contains("Join us").clickLink();
      cy.url().should("include", "/join");
    });

    it("navigates to /committee", () => {
      cy.task("db:create_committee");
      cy.get("header nav a").contains("Committee").clickLink();
      cy.url().should("include", "/committee");
    });

    context("when not logged in", () => {
      it("doesn't navigate to /members", () => {
        cy.get("header nav a").contains("Members").should("not.exist");
      });

      it("navigates to login page", () => {
        cy.get("header nav").contains("Log in").click();
      });
    });

    context("when logged in", () => {
      before(() => {
        cy.task("db:create_login_users");
      });

      beforeEach(() => {
        cy.login("cypress_user", "abc123");
        cy.visit("/");
      });

      it("navigates to /members", () => {
        cy.get("header nav a").contains("Members").clickLink();
        cy.url().should("include", "members");
      });

      it("contains working logout button", () => {
        cy.get("header nav a").contains("Log out").clickLink();
        cy.get("header nav a").contains("Members").should("not.exist");
      });
    });
  });

  it("shows the logo", () => {
    cy.get("header [data-test='logo']").should("be.visible");
  });
});

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
    visitOnce("/faqs/book");

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
    visitOnce("/faqs/join");

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
