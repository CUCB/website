describe("homepage", () => {
  before(() => {
    cy.visit("/");
  });

  it("has the correct favicon", () => {
    cy.document()
      .its("head")
      .find('link[rel="icon"]')
      .should("have.attr", "href")
      .should("eq", "favicon.ico");
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
    cy.wait(200);
    cy.percySnapshot();
  });
});

describe("book us page", () => {
  before(() => {
    cy.visit("/book");
  });

  it("has testimonial", () => {
    cy.get(".testimonial").should("be.visible");
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
      .and("include", "/lists");
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

  it("has map", () => {
    cy.get("[data-test=map]").should("be.visible");
  });
});
