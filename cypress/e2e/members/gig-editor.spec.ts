/// <reference types="Cypress" />

import { DateTime } from "luxon";

const click = ($el) => $el.click(); // For retrying clicks, see https://www.cypress.io/blog/2019/01/22/when-can-the-test-click/

let onConflictUser = {
  constraint: "cucb_users_id_key",
  update_columns: ["first", "last", "email"],
};

let onConflictUserInstrument = {
  constraint: "cucb_users_instruments_id_key",
  update_columns: ["nickname", "instr_id", "deleted"],
};

let onConflictLineupUserInstrument = {
  constraint: "gigs_lineups_instruments_pkey",
  update_columns: ["approved"],
};

let gig = {
  id: "74527",
  type: "1",
  title: "Gig of excitement",
  admins_only: false,
  allow_signups: true,
  date: "2020-07-25",
  time: "21:00",
  arrive_time: DateTime.fromISO("2020-07-25T20:00+01:00").toJSDate(),
  finish_time: DateTime.fromISO("2020-07-25T23:00+01:00").toJSDate(),
  quote_date: "2020-01-01",
  finance_deposit_received: true,
  finance_payment_received: false,
  finance_caller_paid: false,
  venue: {
    address: "3 Trumpington St, Cambridge",
    postcode: "CB2 1QY",
    distance_miles: 0,
    longitude: 0.1182611,
    latitude: 52.2014254,
    map_link:
      "https://www.google.com/maps/place/Emmanuel+United+Reformed+Church/@52.2014254,0.1182611,15z/data=!4m5!3m4!1s0x0:0x4386e0813db16b3e!8m2!3d52.2014254!4d0.1182611",
    name: "Emmanuel United Reform Church",
    notes_band: "Where we (used to) rehearse",
    subvenue: null,
    id: "3277452",
  },
  lineup: [
    {
      approved: true,
      leader: true,
      equipment: false,
      money_collector: false,
      driver: false,
      user: {
        id: "374325",
        username: "leady374325",
        first: "Leady",
        last: "Lead",
        email: "user374325@testi.ng",
        instruments: [
          {
            id: "105747",
            deleted: false,
            instrument: "20",
            nickname: null,
          },
          {
            id: "576743",
            deleted: true,
            instrument: "63",
            nickname: "Cluck cluck",
          },
        ],
      },
      user_instruments: [
        {
          user_instrument_id: 105747,
          approved: true,
        },
        {
          user_instrument_id: 576743,
          approved: true,
        },
      ],
    },
    {
      approved: true,
      leader: false,
      equipment: true,
      driver: true,
      money_collector: true,
      user: {
        id: "567236",
        username: "User567236",
        first: "Twizzly",
        last: "Dialy",
        email: "user567236@testi.ng",
        instruments: [
          {
            id: "547452",
            deleted: false,
            instrument: "66",
            nickname: null,
          },
        ],
      },
    },
  ],
};

let venues = [1, 2, 3, 4, 5].map((n) => ({
  address: "3 Trumpington St, Cambridge",
  postcode: "CB2 1QY",
  distance_miles: 0,
  longitude: 0.1182611,
  latitude: 52.2014254,
  map_link:
    "https://www.google.com/maps/place/Emmanuel+United+Reformed+Church/@52.2014254,0.1182611,15z/data=!4m5!3m4!1s0x0:0x4386e0813db16b3e!8m2!3d52.2014254!4d0.1182611",
  name: `A really long venue name to search for ${n.toString().repeat(n)}`,
  notes_band: null,
  subvenue: null,
  id: (3277457 * n).toString(),
}));

let contacts = [
  {
    id: "3274354",
    user_id: "32747",
    name: "Cally Call",
    email: "caller@call.io",
    organization: null,
    notes: null,
    caller: true,
  },
  {
    id: (3274354 * 2).toString(),
    user_id: null,
    name: "A Client1",
    email: "client@gmail.com",
    organization: null,
    notes: null,
    caller: false,
  },
  {
    id: (3274354 * 3).toString(),
    user_id: null,
    name: "A Client2",
    email: "client@gmail.com",
    organization: null,
    notes: null,
    caller: false,
  },
  {
    id: (3274354 * 4).toString(),
    user_id: null,
    name: "A Client3",
    email: "client@gmail.com",
    organization: null,
    notes: null,
    caller: false,
  },
];

describe("gig editor", () => {
  before(() => {
    cy.task("db:create_login_users");
  });

  context("saving changes", () => {
    beforeEach(() => {
      cy.task("db:delete_contacts", { $or: [{ name: { $like: "%A Client%" } }, { name: { $like: "A Caller%" } }] });
      cy.task("db:delete_venues", { name: { $like: "%og on%" } });
      cy.task("db:delete_gig", gig.id);
      cy.task("db:create_venues", venues);
      cy.task("db:create_contacts", contacts);
      cy.task("db:create_gig", gig);
      cy.login("cypress", "abc123");
      cy.visit(`/members/gigs/${gig.id}/edit`);
      cy.waitForFormInteractive();
    });

    it("detects unsaved changes", () => {
      cy.contains("unsaved changes").should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-title]`).click().type("modified title", { delay: 0 });
      cy.contains("unsaved changes").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-title]`).clear().type(gig.title, { delay: 0 });
      cy.contains("unsaved changes").should("not.exist");
    });

    it("allows the user to search venues with the keyboard", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search]`)
        .click()
        .type("really long vneue to search for 333", { delay: 0 }) // Deliberately misspelled to test fuzzy search
        .type("{downarrow}");
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search-result]`).contains("333").should("have.focus").type(" ");
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .should("have.value", venues[2].id)
        .should("have.focus");
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search]`)
        .should("be.empty")
        .click()
        .type("A really long vneue to search for", { delay: 0 }) // Deliberately misspelled to test fuzzy search
        .type("{downarrow}{downarrow}");
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search-result]`)
        .contains("22")
        .should("have.focus")
        .type("{uparrow}{uparrow}{uparrow}");
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search]`).should("have.focus");
    });

    it("can update gig details", () => {
      let newDate = Cypress.DateTime.local().plus({ weeks: 7 });
      cy.get(`[data-test=gig-edit-${gig.id}-title]`)
        .click()
        .clear()
        .type("Replaced title", { delay: 0 })
        .clear()
        .type("Replaced title", { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-date]`).click().type(newDate.toFormat("yyyy-LL-dd"), { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-date]`)
        .click()
        .type(newDate.toFormat("yyyy-LL-dd"), { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-date]`)
        .click()
        .type(newDate.toFormat("yyyy-LL-dd"), { delay: 0 });

      cy.get(`[data-test=gig-edit-${gig.id}-notes-band]`)
        .click()
        .clear()
        .type("        ", { delay: 0 })
        .log("should trim that field");
      cy.get(`[data-test=gig-edit-${gig.id}-advertise]`).check();
      cy.get(`[data-test=gig-edit-${gig.id}-finance-deposit]`).uncheck();
      cy.get(`[data-test=gig-edit-${gig.id}-finance]`).click().clear().type("Deposit: some amount", { delay: 0 });

      cy.contains("unsaved changes").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.contains("unsaved changes").should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-notes-admin]`).click().clear().type("Setting admin notes", { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-summary]`).click().clear().type("Some sort of summary", { delay: 0 });

      cy.contains("unsaved changes").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-summary]`).type("{alt}s").log("can save with alt+s");
      cy.contains("unsaved changes").should("not.exist");
      cy.get("h2").should("contain", "Replaced title").and("not.contain", gig.title);
      cy.visit(`/members/gigs/${gig.id}`);
      cy.contains("Replaced title").should("be.visible");
      cy.contains("Some sort of summary").should("be.visible");
      cy.contains("Admin notes").should("be.visible");
      cy.contains("Setting admin notes").should("be.visible");
      cy.contains("Band notes").should("not.exist");
      cy.contains("Deposit not received").should("be.visible");
      cy.contains("Public advert").should("be.visible");
      cy.contains("Deposit: some amount").should("be.visible");
    });

    it("can add clients and callers", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).invoke("val").should("be.null");
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).invoke("val").should("be.null");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`).contains(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-callers-${contacts[0].id}-remove]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).should("not.contain", contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`).contains(contacts[0].name);

      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-clients-${contacts[0].id}-remove]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains(contacts[0].name);
    });

    it("sorts contacts when adding them to a gig", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[2].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[1].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[3].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`)
        .contains(contacts[3].name)
        .log("Wait for the last name to appear");
      // verify the names are indeed in sorted order
      const toStrings = (cells$) => Cypress._.map(cells$, "textContent");
      cy.get(`[data-test=gig-edit-${gig.id}-client-list] [data-test=contact-name]`)
        .then(toStrings)
        .then((names) => {
          expect(names[0]).to.equal(contacts[1].name);
          expect(names[1]).to.equal(contacts[2].name);
          expect(names[2]).to.equal(contacts[3].name);
        });

      cy.reload();

      cy.get(`[data-test=gig-edit-${gig.id}-client-list] [data-test=contact-name]`)
        .then(toStrings)
        .then((names) => {
          expect(names[0]).to.equal(contacts[1].name);
          expect(names[1]).to.equal(contacts[2].name);
          expect(names[2]).to.equal(contacts[3].name);
        });
    });

    it("can edit existing clients and callers", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[1].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-clients-${contacts[1].id}-edit]`).click();
      cy.get(`[data-test=contact-editor-organization]`).click().clear().type("Some org", { delay: 0 });
      cy.get(`[data-test=contact-editor-name]`).click().clear().type("A ClientN", { delay: 0 });
      cy.get(`[data-test=contact-editor-save]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`).contains("A ClientN @ Some org");
      cy.get(`[data-test=gig-edit-${gig.id}-client-select]`).contains("A Client1").should("not.exist");
      cy.reload();
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`).contains("A ClientN @ Some org");
      cy.get(`[data-test=gig-edit-${gig.id}-client-select]`).contains("A Client1").should("not.exist");
    });

    it("can create new contacts and add them to gigs", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`, { log: false }).select(
        contacts[1].name,
        { log: false },
      ); // Wait for buttons to have event handlers sorted
      cy.waitForFormInteractive();
      cy.log("Waited for page to be ready");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-new]`).click();
      cy.get(`[data-test=contact-editor-caller]`).should("be.checked");
      cy.get(`[data-test=contact-editor-name]`).type("A Caller", { delay: 0 });
      cy.get(`[data-test=contact-editor-email]`).type("a.caller@ceili.dh", { delay: 0 });
      cy.get(`[data-test=contact-editor-save]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`)
        .find(":selected")
        .contains("A Caller");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains("A Caller", { delay: 0 });
      cy.reload();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains("A Caller", { delay: 0 });
    });

    it("can create a new venue", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`, { log: false }).select(
        contacts[1].name,
        { log: false },
      ); // Wait for buttons to have event handlers sorted
      cy.log("Waited for page to be ready");
      cy.get(`[data-test=gig-edit-${gig.id}-create-venue]`).click();
      cy.get(`[data-test=venue-editor-name]`).click().type("Mog on the Tyne", { delay: 0 });
      cy.get(`[data-test=venue-editor-map-link]`).paste(
        "https://www.google.com/maps/place/Mog+on+the+Tyne/@54.9706584,-1.6163193,0.25z",
      );
      cy.get(`[data-test=venue-editor-latitude]`).should("have.value", "54.9706584");
      cy.get(`[data-test=venue-editor-longitude]`).should("have.value", "-1.6163193");
      cy.get(`[data-test=venue-editor-notes-band]`).click().type("Notey notey note", { delay: 0 });
      cy.get(`[data-test=venue-editor-save]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .should("have.focus")
        .find(":selected")
        .contains("Mog on the Tyne");

      cy.get(`[data-test=gig-edit-${gig.id}-create-venue]`).click();
      cy.get(`[data-test=venue-editor-name]`).click().type("Cog on the Line", { delay: 0 });
      cy.get(`[data-test=venue-editor-save]`).click();

      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .find(":contains('og on')")
        .then((elements) => {
          let venues = Cypress.$.map(elements, (e) => e.innerHTML);
          expect(venues).to.have.length(2).and.be.ascending;
        });

      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`).select("Mog on the Tyne");
      cy.get(`[data-test=gig-edit-${gig.id}-edit-venue]`).click();
      cy.get(`[data-test=venue-editor-name]`).should("have.value", "Mog on the Tyne");
      cy.get(`[data-test=venue-editor-notes-band]`).should("have.value", "Notey notey note");
      cy.get(`[data-test=venue-editor-subvenue]`).type("Prrrrs", { delay: 0 });
      cy.get(`[data-test=venue-editor-cancel]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .should("have.focus")
        .find(":selected")
        .should("contain", "Mog on the Tyne")
        .and("not.contain", "Prrr");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.reload();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .find(":selected")
        .should("contain", "Mog on the Tyne")
        .and("not.contain", "Prrr");
    });

    it("can search for a newly created venue", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`, { log: false }).select(
        contacts[1].name,
        { log: false },
      ); // Wait for buttons to have event handlers sorted
      cy.log("Waited for page to be ready");
      cy.get(`[data-test=gig-edit-${gig.id}-create-venue]`).click();
      cy.get(`[data-test=venue-editor-name]`).click().type("Sog on the Pine", { delay: 0 });
      cy.get(`[data-test=venue-editor-subvenue]`).click().type("A subvenue", { delay: 0 });
      cy.get(`[data-test=venue-editor-save]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`).select(venues[2].name);
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search]`).click().type("Sog on the", { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-venue-search-result]`).contains("Sog on the Pine", { delay: 0 }).click();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`)
        .find(":selected")
        .contains("Sog on the Pine")
        .contains("A subvenue");
      cy.get(`[data-test=gig-edit-${gig.id}-edit-venue]`).click();
      cy.get(`[data-test=venue-editor-subvenue]`).click().clear().type("A different subvenue", { delay: 0 });
      cy.get(`[data-test=venue-editor-save]`).click();
      cy.get(`[data-test=venue-editor-save]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.visit(`/members/gigs/${gig.id}`);
      cy.get("*").should("contain", "Sog on the Pine").and("contain", "A different subvenue");
    });

    it("rejects invalid dates with custom error messages", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-time]`).click().type("19:13");
      cy.get(`[data-test=gig-edit-${gig.id}-time]`).click().type("20:26");
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-time]`).click().type("18:00");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.contains("unsaved changes").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-time]`).then(($input) => {
        cy.log("Check field for custom error");
        expect($input[0].validationMessage).to.match(/[Ff]inish time/);
        expect($input[0].validationMessage).to.match(/[Aa]rrive time/);
      });
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-time]`).click().type("22:00");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.contains("unsaved changes").should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-time]`).click().type("00:00");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-time]`).then(($input) => {
        cy.log("Check field for custom error");
        expect($input[0].validationMessage).to.match(/[Ff]inish time/);
        expect($input[0].validationMessage).to.match(/[Ss]tart time/);
      });
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-time]`).then(($input) => {
        cy.log("Check field for custom error");
        expect($input[0].validationMessage).to.match(/[Aa]rrive time/);
      });
      cy.visit(`/members/gigs/${gig.id}`);
      cy.contains("Arrive time: 19:13").should("be.visible");
      cy.contains("Start time: 20:26").should("be.visible");
      cy.contains("Finish time: 22:00").should("be.visible");
    });

    it("warns when arrive time coincides with start time", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-time]`).click().type("19:00");
      cy.get(`[data-test=gig-edit-${gig.id}-time]`).click().type("19:00");
      cy.get(`[data-test=gig-edit-${gig.id}-timing-warnings]`)
        .children()
        .should("have.length", 1)
        .invoke("html")
        .should("match", /[Aa]rrive time/)
        .and("match", /[Ss]tart time/);
    });

    it("filters selected callers and clients from lists to add", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`)
        .contains(contacts[0].name)
        .should("not.exist");

      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`).select(contacts[1].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`)
        .contains(contacts[1].name)
        .should("not.exist");
    });

    it("can search for clients and add them to a gig", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-client-search]`).click().type(contacts[1].name, { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-client-search-results]`).contains(contacts[1].name).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`)
        .find(":selected")
        .invoke("html")
        .should("eq", contacts[1].name);
      cy.get(`[data-test=gig-edit-${gig.id}-client-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-client-search]`).invoke("val").should("be.empty");
      cy.get(`[data-test=gig-edit-${gig.id}-client-list]`).contains(contacts[1].name).should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-client-search]`).click().type(contacts[1].name, { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-client-search-results]`).contains(contacts[1].name).should("not.exist");
    });

    it("can search for callers and add them to a gig", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search]`).click().type(contacts[0].name, { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search-results]`).contains(contacts[0].name).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`)
        .find(":selected")
        .invoke("html")
        .should("eq", contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search]`).invoke("val").should("be.empty");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-list]`).contains(contacts[0].name).should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search]`).click().type(contacts[0].name, { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search-results]`).contains(contacts[0].name).should("not.exist");
    });

    it("updates caller details in client list when edited", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-callers-${contacts[0].id}-edit]`).click();
      cy.get(`[data-test=contact-editor-name]`).click().clear().type("New Name", { delay: 0 });
      cy.get(`[data-test=contact-editor-email]`).click().clear().type("someone@gmail.com", { delay: 0 });
      cy.get(`[data-test=contact-editor-save]`).click();
      cy.get(`[data-test=contact-name]`).contains("New Name").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-client-select] [data-test=select-box]`)
        .contains("New Name")
        .should("exist");
      cy.get(`[data-test=gig-edit-${gig.id}-client-search]`).click().type("someone@gmail.com", { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-client-search-results]`).contains("New Name").should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-client-search]`).click().clear().type(contacts[0].name, { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-client-search-results]`).contains("New Name").should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-client-search-results]`).contains(contacts[0].name).should("not.exist");
    });

    it("clears unwanted fields when saving calendar events", () => {
      cy.waitForFormInteractive();
      cy.get(`[data-test=gig-edit-${gig.id}-food-provided]`).check();
      cy.get(`[data-test=gig-edit-${gig.id}-allow-signups]`).check();
      cy.get(`[data-test=gig-edit-${gig.id}-advertise]`).check();
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.get(`[href='/members/gigs/${gig.id}']`).click();
      cy.url().should("not.contain", "edit");
      cy.contains("Arrive time").should("be.visible");
      cy.contains("Start time").should("be.visible");
      cy.contains("Finish time").should("be.visible");
      cy.get(`[data-test=show-signup-${gig.id}]`).should("be.visible");
      cy.get(`[data-test=icon-food-provided]`).should("be.visible");
      cy.get(`[href='/members/gigs/${gig.id}/edit']`).click();
      cy.waitForFormInteractive();
      cy.get(`[data-test=gig-edit-${gig.id}-type] [data-test=select-box]`).select("Calendar Dates");
      cy.get(`[data-test=gig-edit-${gig.id}-date]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-date]`).type("2021-01-01");
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-date]`).type("2021-01-03");
      cy.get(`[data-test=gig-edit-${gig.id}-save]`).click();
      cy.get(`[href='/members/gigs/${gig.id}']`).click();
      cy.url().should("not.contain", "edit");
      cy.contains("Arrive time").should("not.exist");
      cy.contains("Start time").should("not.exist");
      cy.contains("Finish time").should("not.exist");
      cy.get(`[data-test=show-signup-${gig.id}]`).should("not.exist");
      cy.get(`[data-test=icon-food-provided]`).should("not.exist");
    });
  });

  context("not saving changes", () => {
    before(() => {
      cy.task("db:delete_contacts", { $or: [{ name: { $like: "%A Client%" } }, { name: { $like: "A Caller%" } }] });
      cy.task("db:delete_venues", { name: { $like: "%og on%" } });
      cy.task("db:delete_gig", gig.id);
      cy.task("db:create_gig", gig);
      cy.task("db:create_venues", venues);
      cy.task("db:create_contacts", contacts);
    });

    beforeEach(() => {
      cy.login("cypress", "abc123");
      cy.visit(`/members/gigs/${gig.id}/edit`);
      cy.waitForFormInteractive();
    });

    it("warns when gig is unusually long", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-finish-time-time]`).click().type("10:00");
      cy.get(`[data-test=gig-edit-${gig.id}-infer-finish-date]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-timing-warnings]`)
        .children()
        .should("have.length", 1)
        .and("contain", "longer than 6 hours");
    });

    it("can preview a gig summary", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-show-preview]`).click().should("not.exist");
      cy.get(`[data-test=gig-summary-${gig.id}]`)
        .should("contain", gig.title)
        .and("contain", Cypress.DateTime.fromJSDate(gig.arrive_time).toFormat("HH:mm"))
        .and("contain", gig.time)
        .and("contain", "Deposit received")
        .and("contain", "Caller not paid")
        .and("contain", gig.venue.name)
        .and("not.contain", "Edit gig");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).select(contacts[0].name);
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select-confirm]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-venue-select] [data-test=select-box]`).select(
        "A really long venue name to search for 1",
      );

      cy.get(`[data-test=gig-summary-${gig.id}]`)
        .should("contain", gig.title)
        .and("contain", Cypress.DateTime.fromJSDate(gig.arrive_time).toFormat("HH:mm"))
        .and("contain", gig.time)
        .and("contain", "Deposit received")
        .and("contain", "Caller not paid")
        .and("contain", "A really long venue name to search for 1");

      cy.get(`[data-test=gig-edit-${gig.id}-hide-preview]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-finance-payment]`).click();
      cy.get(`[data-test=gig-edit-${gig.id}-finance-caller]`).check();
      cy.get(`[data-test=gig-edit-${gig.id}-advertise]`).check();
      cy.get(`[data-test=gig-edit-${gig.id}-summary]`).click().type("Some public advert", { delay: 0 });
      cy.get(`[data-test=gig-edit-${gig.id}-show-preview]`).click();
      cy.get(`[data-test=gig-summary-${gig.id}]`)
        .should("contain", "Payment received")
        .and("contain", "Caller paid")
        .and("contain", "Public advert")
        .and("contain", "Some public advert");

      cy.get(`[data-test=gig-edit-${gig.id}-create-venue]`).click();
      cy.get(`[data-test=venue-editor-cancel]`).click();
      cy.get(`[data-test=gig-summary-${gig.id}]`).should("contain", "A really long venue name to search for 1");
    });

    it("hides unneeded fields for calendar dates", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-type] [data-test=select-box]`).select("Calendar Dates");
      cy.get(`[data-test=gig-edit-${gig.id}-finance]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-finance-caller]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-advertise]`).should("not.exist");
    });

    it("hides unneeded fields for kit", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-type] [data-test=select-box]`).select("Kit Borrowing");
      cy.get(`[data-test=gig-edit-${gig.id}-finance]`).should("be.visible");
      cy.get(`[data-test=gig-edit-${gig.id}-finance-caller]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select]`).should("not.exist");
      cy.get(`[data-test=gig-edit-${gig.id}-advertise]`).should("not.exist");
    });

    it("disables details fields for cancelled gigs", () => {
      cy.get(`[data-test=gig-edit-${gig.id}-type] [data-test=select-box]`).select("Cancelled Gig");
      cy.get(`[data-test=gig-edit-${gig.id}-finance]`).should("not.be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-finance-deposit]`).should("not.be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-select] [data-test=select-box]`).should("be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-allow-signups]`).should("not.be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-admins-only]`).should("not.be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-title]`).should("be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-arrive-time-date]`).should("be.disabled");
      cy.get(`[data-test=gig-edit-${gig.id}-caller-search]`).should("be.disabled");
    });
  });
});
