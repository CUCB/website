describe("homepage", () => {
  before(() => {
    cy.visit("/");
  });

  it("has the correct favicon", () => {
    cy.document()
      .its("head")
      .find('link[rel="icon"]')
      .should("have.attr", "href")
      .should("eq", "static/favicon.ico");
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
    cy.get("li a")
      .contains("Facebook")
      .should("have.prop", "href")
      .and("include", "facebook.com/CUCeilidhBand");
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

  it("allows a user to submit a booking request", () => {
    cy.route2({
      method: "POST",
      url: "/contact",
    }).as("contact");
    cy.get("[data-test='booking-name']")
      .click()
      .type("Testy test");
    cy.get("[data-test='booking-email']")
      .click()
      .type("testy@te.st");
    cy.get("[data-test='booking-message']")
      .click()
      .type("testy test");
    cy.get("[data-test=hcaptcha] > iframe").then($element => {
      const $body = $element.contents().find("body");
      cy.wrap($body)
        .find("#checkbox")
        .click();
      cy.wrap($body).find("#checkbox.checked");
    });
    cy.get("[data-test='booking-send']").click();
    cy.wait("@contact");
  });

  it("prevents a user from submitting the booking form when not captcha'd", () => {
    cy.route2({
      method: "POST",
      url: "/contact",
    }).as("contact");
    cy.get("[data-test='booking-name']")
      .click()
      .type("Testy test");
    cy.get("[data-test='booking-email']")
      .click()
      .type("testy@te.st");
    cy.get("[data-test='booking-message']")
      .click()
      .type("testy test");
    cy.get("[data-test='booking-send']").click();
    cy.get(".error").contains("captcha");
    cy.cssProperty("--negative").then(color => {
      cy.get(".error")
        .should("have.css", "color")
        .and("eq", color);
    });
  });
});

describe("sessions page", () => {
  before(() => {
    cy.visit("/session");
  });

  it("has a link to mailing lists", () => {
    cy.get("a")
      .contains("mailing list")
      .should("have.prop", "href")
      .and("include", "/mailinglists");
  });
});

describe("join page", () => {
  before(() => {
    cy.visit("/join");
  });

  it("has a link to mailing list", () => {
    cy.get("p a")
      .contains("mailing list")
      .should("have.prop", "href")
      .and("include", "/mailinglists/");
  });
});
