let signups = [
  // Names from http://tabbycats.club/
  {
    user: { first: "Huggable", last: "Treasurechest", gig_notes: "Can only lead on fiddle", prefs: ["leader"] },
    user_available: true,
    user_instruments: [["Fiddle", "Stringy"], "Mandolin"],
    user_notes: "Fiddle if possible, please",
  },
  {
    user: {
      first: "Infinite",
      last: "Smasher",
      gig_notes: "",
      prefs: ["soundtech"],
      user_instruments: ["Drum(s)", "Cajón", "-Melodeon"],
    },
    user_available: true,
    user_instruments: ["Bodhran"],
    user_notes: "",
  },
  {
    user: { first: "Poofy", last: "Bubby", gig_notes: "", prefs: ["soundtech", "driver", "car"] },
    user_available: true,
    user_only_if_necessary: true,
    user_instruments: ["Guitar", "Whistle(s)"],
    user_notes: "",
  },
  {
    user: { first: "Sneaky", last: "Burglar", gig_notes: "", prefs: [] },
    user_available: false,
    user_only_if_necessary: false,
    user_instruments: [],
    user_notes: "Can't make this one",
  },
  {
    user: { first: "Old Man", last: "Ringpop", gig_notes: "", prefs: [] },
    user_available: false,
    user_only_if_necessary: false,
    user_instruments: ["Kazoo", "Bombarde"],
    user_notes: "",
  },
];

describe("lineup editor", () => {
  let signupsToInsert;
  beforeEach(() => {
    let melodeonId, clarinetId;
    cy.task("db:create_gig", {
      id: "15274",
      title: "Cypress Demo Gig",
      type: "1",
      admins_only: false,
      allow_signups: false,
    });
    cy.task("db:delete_signups", { id: "15274" });
    cy.task("db:delete_gig", "15275");
    cy.task("db:create_login_users");
    cy.task("db:attribute_ids_by_name").then((attributeIds) => {
      cy.task("db:instrument_ids_by_name").then((instrumentIds) => {
        let userIdBase = 283472;
        let userInstrumentIdBase = 283479;
        let userInstrumentCount = 0;
        let userCount = 0;
        signupsToInsert = [];

        melodeonId = instrumentIds["Melodeon"];
        clarinetId = instrumentIds["Clarinet"];
        for (const person of signups) {
          person.user.id = (userIdBase * ++userCount).toString();
          if (
            typeof person.user_instruments?.[0] === "string" ||
            (typeof person.user_instruments?.[0] === "object" && person.user_instruments[0].hasOwnProperty(0))
          ) {
            person.user_instruments = person.user_instruments?.map((name) => {
              let fields = typeof name !== "string" ? { name: name[0], nickname: name[1] } : { name };
              let deleted = false;
              if (fields.name.startsWith("-")) {
                fields.name = fields.name.slice(1);
                deleted = true;
              }
              return {
                id: (userInstrumentIdBase * ++userInstrumentCount).toString(),
                instrument: instrumentIds[fields.name],
                nickname: fields.nickname,
                name: fields.name,
                deleted,
              };
            });
            person.user.user_instruments = person.user.user_instruments?.map((name) => {
              let fields = typeof name !== "string" ? { name: name[0], nickname: name[1] } : { name };
              let deleted = false;
              if (fields.name.startsWith("-")) {
                fields.name = fields.name.slice(1);
                deleted = true;
              }
              return {
                id: (userInstrumentIdBase * ++userInstrumentCount).toString(),
                instrument: instrumentIds[fields.name],
                nickname: fields.nickname,
                name: fields.name,
                deleted,
              };
            });
          }
          let userPrefs = person.user.prefs.map((name) => ({
            pref_type: attributeIds[name],
            value: true,
          }));
          let signupInstruments =
            person.user_instruments &&
            person.user_instruments.map(({ id }) => ({
              approved: null,
              user_instrument: id,
            }));
          let userInstruments = {
            instruments: [...(person.user.user_instruments || []), ...person.user_instruments].map((instrument) => ({
              ...instrument,
              name: undefined,
            })),
          };

          signupsToInsert.push({
            ...person,
            user: {
              email: `user${person.user.id}@lineup-edit.or`,
              username: `cypress_gig_lineup_u${person.user.id}`,
              admin: "9",
              ...person.user,
              prefs: userPrefs,
              ...userInstruments,
            },
            user_instruments: signupInstruments,
            leader: false,
            money_collector: false,
            money_collector_notified: false,
            equipment: false,
            driver: false,
            approved: null,
          });
          for (const signup of signupsToInsert) {
            delete signup.user["user_instruments"];
          }
        }
        cy.log(signupsToInsert);

        cy.task(
          "db:delete_users_where",
          signupsToInsert.map((signup) => ({ id: signup.user.id })),
        );
        cy.task("db:create_lineup", { entries: signupsToInsert, gig: "15274" });
        cy.task("db:delete_instruments_for_user", "27382");
        cy.task("db:create_user_instrument", { id: "53257432", user: "27382", instrument: melodeonId });
        cy.task("db:create_user_instrument", { id: "53257433", user: "27382", instrument: clarinetId });
      });
    });
  });

  context("authorized as president", () => {
    beforeEach(() => cy.login("cypress_president", "abc123"));

    it("gives a 404 error when the gig doesn't exist", () => {
      cy.request({
        url: "/members/gigs/15275/edit-lineup",
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 404);
    });

    it("gives a 404 error if the gig is kit hire, calendar event, cancelled or an enquiry", () => {
      cy.task("db:all_gig_types").then((gigTypes) => {
        for (const type of gigTypes.filter((type) => type.code !== "gig")) {
          cy.log(`Testing ${type.title}`);
          cy.task("db:update_gig_type", { id: "15274", type: type.id });
          cy.request({
            url: "/members/gigs/15274/edit-lineup",
            failOnStatusCode: false,
          })
            .its("status")
            .should("eq", 404);
        }
      });
    });

    context("viewing valid gig", () => {
      beforeEach(() => {
        cy.visit("/members/gigs/15274/edit-lineup");
        cy.waitForFormInteractive();
      });

      it("lists the people and instruments who have signed up to the gig", () => {
        for (let person of signups) {
          let listSelector = person.approved
            ? "lineup-editor-approved"
            : person.user_available
            ? "lineup-editor-applicants"
            : "lineup-editor-nope";
          cy.get(`[data-test=${listSelector}] [data-test=member-${person.user.id}]`).then(($row) => {
            if (person.user.prefs.includes("leader")) {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-leader]`)
                .should("be.visible")
                .click()
                .hasTooltip(`${person.user.first} can lead`);
            } else {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-leader]`).should(
                "not.exist",
              );
            }
            if (person.user.prefs.includes("soundtech")) {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-soundtech]`)
                .should("be.visible")
                .click()
                .hasTooltip(`${person.user.first} can tech`);
            } else {
              cy.get(
                `[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-soundtech]`,
              ).should("not.exist");
            }
            if (person.user.prefs.includes("driver")) {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-driver]`)
                .should("be.visible")
                .click()
                .hasTooltip(`${person.user.first} can drive`);
            } else {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-driver]`).should(
                "not.exist",
              );
            }
            if (person.user.prefs.includes("car")) {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-car]`)
                .should("be.visible")
                .click()
                .hasTooltip(`${person.user.first} has a car`);
            } else {
              cy.get(`[data-test=member-${person.user.id}] [data-test=attribute-icons] [data-test=icon-car]`).should(
                "not.exist",
              );
            }
            cy.wrap($row).within(() => {
              for (let instrument of person.user_instruments) {
                cy.get("[data-test=instrument-name]")
                  .contains(instrument.name)
                  .should("be.visible")
                  .parents(`[data-test=instrument-${instrument.id}]`)
                  .within(() => {
                    cy.get("[data-test=instrument-maybe]").should("have.attr", "aria-checked", "true");
                  });
              }
              let availability = person.user_available
                ? person.user_only_if_necessary
                  ? "if necessary"
                  : "available"
                : "unavailable";
              cy.get(`[data-test=user-availability]`).should("contain", person.user.first).and("contain", availability);
            });
          });
          cy.get(`[data-test=instrument-${signups[0].user_instruments[0].id}] [data-test=nickname-hover]`).hasTooltip(
            signups[0].user_instruments[0].nickname,
          );
        }
      });

      it("can approve/discard people", () => {
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-approve]`)
          .click()
          .should(($el) => expect($el).to.not.exist);
        cy.get(`[data-test=lineup-editor-approved] [data-test=member-${signups[0].user.id}]`).should("be.visible");
        cy.get(`[data-test=lineup-editor-applicants] [data-test=member-${signups[0].user.id}]`).should("not.exist");
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=person-approve]`)
          .click()
          .should(($el) => expect($el).to.not.exist);
        cy.get(`[data-test=lineup-editor-approved] [data-test=member-${signups[1].user.id}]`).should("be.visible");
        cy.get(`[data-test=lineup-editor-applicants] [data-test=member-${signups[1].user.id}]`).should("not.exist");
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-unapprove]`)
          .click()
          .should(($el) => expect($el).to.not.exist);
        cy.get(`[data-test=lineup-editor-applicants] [data-test=member-${signups[0].user.id}]`).should("be.visible");
        cy.get(`[data-test=lineup-editor-approved] [data-test=member-${signups[0].user.id}]`).should("not.exist");
        cy.get(`[data-test=member-${signups[2].user.id}] [data-test=person-discard]`)
          .click()
          .should(($el) => expect($el).to.not.exist);
        cy.get(`[data-test=lineup-editor-nope] [data-test=member-${signups[2].user.id}]`).should("be.visible");
        cy.get(`[data-test=lineup-editor-applicants] [data-test=member-${signups[2].user.id}]`).should("not.exist");
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-discard]`)
          .click()
          .should(($el) => expect($el).to.not.exist);
        cy.get(`[data-test=lineup-editor-nope] [data-test=member-${signups[0].user.id}]`).should("be.visible");
        cy.get(`[data-test=lineup-editor-applicants] [data-test=member-${signups[0].user.id}]`).should("not.exist");
      });

      it("shows people in the correct sections", () => {
        cy.get(`[data-test=signup-yes]`).should("contain", `${signups[0].user.first} ${signups[0].user.last}`);
        cy.get(`[data-test=signup-maybe]`).should("contain", `${signups[2].user.first} ${signups[2].user.last}`);
        cy.get(`[data-test=signup-nope]`).should("contain", `${signups[3].user.first} ${signups[3].user.last}`);
        cy.get(`[data-test=member-${signups[3].user.id}] [data-test=person-discard]`).click().should("not.exist");
        cy.get(`[data-test=people-discarded] [data-test=member-${signups[3].user.id}]`).should("be.visible");
        cy.get(`[data-test=signup-nope] [data-test=member-${signups[3].user.id}]`).should("not.exist");
      });

      it("can select and discard instruments", () => {
        cy.get(`[data-test=instrument-${signups[0].user_instruments[1].id}] [data-test=instrument-yes]`)
          .click()
          .should("have.attr", "aria-checked", "true");
        cy.get(`[data-test=instrument-${signups[0].user_instruments[0].id}] [data-test=instrument-no]`)
          .click()
          .should("have.attr", "aria-checked", "true");
        cy.get(`[data-test=instrument-${signups[0].user_instruments[0].id}] [data-test=instrument-maybe]`)
          .click()
          .should("have.attr", "aria-checked", "true");
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-discard]`).click().should("not.exist");
        cy.get(`[data-test=instrument-${signups[0].user_instruments[0].id}] [aria-checked=true]`).should(
          "have.attr",
          "data-test",
          "instrument-maybe",
        );
        cy.get(`[data-test=instrument-${signups[0].user_instruments[1].id}] [aria-checked=true]`).should(
          "have.attr",
          "data-test",
          "instrument-yes",
        );
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=person-approve]`).click().should("not.exist");
        cy.get(`[data-test=instrument-${signups[1].user_instruments[0].id}] [data-test=instrument-yes]`)
          .click()
          .should("have.attr", "aria-checked", "true");
        cy.reload();
        cy.get(`[data-test=instrument-${signups[0].user_instruments[0].id}] [aria-checked=true]`).should(
          "have.attr",
          "data-test",
          "instrument-maybe",
        );
        cy.get(`[data-test=instrument-${signups[0].user_instruments[1].id}] [aria-checked=true]`).should(
          "have.attr",
          "data-test",
          "instrument-yes",
        );
        cy.get(`[data-test=instrument-${signups[1].user_instruments[0].id}] [aria-checked=true]`).should(
          "have.attr",
          "data-test",
          "instrument-yes",
        );
      });

      it("can assign roles to members of the lineup", () => {
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-approve]`).click().should("not.exist");
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=toggle-leader]`)
          .click()
          .should("have.attr", "aria-pressed", "true");
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=person-approve]`).click().should("not.exist");
        cy.get(`[data-test=member-${signups[3].user.id}] [data-test=person-approve]`).click().should("not.exist");
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=toggle-equipment]`)
          .click()
          .should("have.attr", "aria-pressed", "true");
        cy.get(`[data-test=member-${signups[3].user.id}]`).within(() => {
          cy.get(`[data-test=toggle-money_collector_notified]`).should("not.exist");
          cy.get(`[data-test=toggle-money_collector]`).click().should("have.attr", "aria-pressed", "true");
          cy.get(`[data-test=toggle-money_collector_notified]`).click().should("have.attr", "aria-pressed", "true");
          cy.get(`[data-test=toggle-money_collector]`).should("be.disabled");
        });
        cy.reload();
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=toggle-leader]`).should(
          "have.attr",
          "aria-pressed",
          "true",
        );
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=toggle-equipment]`).should(
          "have.attr",
          "aria-pressed",
          "false",
        );
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=toggle-equipment]`).should(
          "have.attr",
          "aria-pressed",
          "true",
        );
        cy.get(`[data-test=member-${signups[1].user.id}] [data-test=toggle-money_collector]`).should(
          "have.attr",
          "aria-pressed",
          "false",
        );
        cy.get(`[data-test=member-${signups[3].user.id}] [data-test=toggle-money_collector]`).should(
          "have.attr",
          "aria-pressed",
          "true",
        );
        cy.get(`[data-test=member-${signups[3].user.id}] [data-test=toggle-money_collector_notified]`).should(
          "have.attr",
          "aria-pressed",
          "true",
        );
      });

      it("displays notes for lineup members", () => {
        for (let person of signups) {
          cy.get(`[data-test=member-${person.user.id}]`).within(() => {
            if (person.user_notes) {
              cy.get(`[data-test=user-gig-notes]`).should("contain", person.user_notes);
            } else {
              cy.get(`[data-test=user-gig-notes]`).should("not.exist");
            }

            if (person.user.gig_notes) {
              cy.get(`[data-test=user-global-notes]`).should("contain", person.user.gig_notes);
            } else {
              cy.get(`[data-test=user-global-notes]`).should("not.exist");
            }

            if (person.admin_notes) {
              cy.get(`[data-test=admin-notes]`)
                .should("contain", person.admin_notes)
                .and("have.attr", "contenteditable", "true");
            } else {
              cy.get(`[data-test=admin-notes]`).should("be.visible").and("have.attr", "contenteditable", "true");
            }
          });
        }
      });

      it("allows admin notes to be edited", () => {
        cy.intercept("POST", `/members/gigs/15274/edit-lineup/update`).as("update");
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=admin-notes]`)
          .focus()
          .type("Testing")
          .clear()
          .type("Testing admin notes")
          .blur();
        cy.wait("@update");
        cy.reload();
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=admin-notes]`).should(
          "contain",
          "Testing admin notes",
        );
      });

      it("can add instruments not selected by the user", () => {
        for (let person of signups) {
          cy.get(`[data-test=member-${person.user.id}]`).within(() => {
            cy.get(`[data-test=add-instruments]`).click().should("not.exist");
            person.user_instruments &&
              cy
                .wrap(person.user_instruments)
                .each((instrument) => cy.get(`[data-test=instruments-to-add]`).should("not.contain", instrument.name));
            person.user.user_instruments &&
              cy.wrap(person.user.user_instruments).each((instrument) => {
                if (instrument.deleted) {
                  cy.contains(instrument.name).should("have.regexCSS", "text-decoration", /line-through/);
                } else {
                  cy.get(`[data-test=instruments-to-add]`).should("contain", instrument.name);
                }
              });
            cy.get(`[data-test=cancel-add-instruments]`).click();
          });
        }
        cy.get(`[data-test=member-${signups[1].user.id}]`).within(() => {
          cy.get(`[data-test=add-instruments]`).click();
          cy.get(`[data-test=instruments-to-add]`).contains(signups[1].user.user_instruments[0].name).click();
          cy.contains("Melodeon").should("not.exist");
          cy.get(`[data-test=add-instruments]`).should("be.visible");
          cy.get(`[data-test=cancel-add-instruments]`).should("not.exist");
          cy.get(`[data-test=instrument-${signups[1].user.user_instruments[0].id}]`).within(() => {
            cy.contains(signups[1].user.user_instruments[0].name).should("be.visible");
            cy.get(`[data-test=instrument-maybe]`).should("have.attr", "aria-checked", "true");
            cy.get(`[data-test=instrument-yes]`).click().should("have.attr", "aria-checked", "true");
          });
          cy.reload();
          cy.get(`[data-test=instrument-${signups[1].user.user_instruments[0].id}] [data-test=instrument-yes]`)
            .invoke("attr", "aria-checked")
            .should("eq", "true");
        });
      });

      it("can add people who didn't sign up", () => {
        cy.get(`[data-test=add-lineup-person] [data-test=people-search]`)
          .click()
          .type("Cypress")
          .clear()
          .type("Cypress President");
        cy.get(`[data-test=people-search-results]`).contains("Cypress President").click();
        cy.get(`[data-test=add-lineup-person] [data-test=select-box] :selected`).should("contain", "Cypress President");
        cy.get(`[data-test=confirm-add-lineup-person]`).click();
        cy.get(`[data-test=signup-yes] [data-test=member-27382]`)
          .should("be.visible")
          .within(() => {
            cy.contains("Cypress President").should("be.visible");
            cy.get(`[data-test^=instrument]`).should("not.exist");
            cy.get(`[data-test=add-instruments]`).click().should("not.exist");
            cy.get(`[data-test=instruments-to-add]`).contains("Melodeon").click();
            cy.get(`[data-test=instrument-53257432] [data-test=instrument-yes]`).should("be.visible").click();
            cy.get(`[data-test=person-approve]`).click();
          });
        cy.get(`[data-test=lineup-editor-approved] [data-test=member-27382]`)
          .should("be.visible")
          .within(() => {
            cy.get(`[data-test=add-instruments]`).click().should("not.exist");
            cy.get(`[data-test=instruments-to-add]`).contains("Melodeon").should("not.exist");
            cy.get(`[data-test=instruments-to-add]`).contains("Clarinet").click();
            cy.get(`[data-test=instrument-53257433] [data-test=instrument-yes]`).should("be.visible").click();
          });
        cy.reload();
        cy.get(`[data-test=lineup-editor-approved] [data-test=member-27382]`)
          .should("be.visible")
          .within(() => {
            cy.get(`[data-test=instrument-53257432] [data-test=instrument-yes]`).should(
              "have.attr",
              "aria-checked",
              "true",
            );
            cy.get(`[data-test=instrument-53257433] [data-test=instrument-yes]`).should(
              "have.attr",
              "aria-checked",
              "true",
            );
          });
      });

      it("warns about invalid lineups", () => {
        cy.get(`[data-test=lineup-warnings]`).should("not.exist");
        cy.approveLineupPerson(signups[0].user.id);
        cy.get(`[data-test=lineup-warnings]`)
          .should("contain", "No leader selected")
          .and("contain", "No techie selected");
        cy.toggleLineupRole(signups[0].user.id, "leader");
        cy.get(`[data-test=lineup-warnings]`)
          .should("not.contain", "No leader selected")
          .and("contain", "No techie selected");
        cy.toggleLineupRole(signups[0].user.id, "equipment");
        cy.get(`[data-test=lineup-warnings]`).should("contain", "Someone leading and teching");
        cy.toggleLineupRole(signups[0].user.id, "money_collector");
        cy.get(`[data-test=lineup-warnings]`)
          .should("contain", "Someone leading and teching")
          .and("contain", "Money collector not notified");
        cy.toggleLineupRole(signups[0].user.id, "money_collector_notified");
        cy.get(`[data-test=lineup-warnings]`)
          .should("contain", "Someone leading and teching")
          .and("not.contain", "Money collector not notified");
        cy.toggleLineupRole(signups[0].user.id, "money_collector_notified");
        cy.toggleLineupRole(signups[0].user.id, "money_collector");
        cy.approveLineupPerson(signups[1].user.id);
        cy.toggleLineupRole(signups[0].user.id, "equipment");
        cy.toggleLineupRole(signups[1].user.id, "equipment");
        cy.get(`[data-test=lineup-warnings]`).should("not.exist");
        cy.approveLineupPerson(signups[3].user.id);
        cy.get(`[data-test=lineup-warnings]`).should("contain", "Someone unavailable selected");
      });

      it("doesn't reset the lineup/signup information if dialog cancelled", () => {
        cy.waitForFormInteractive();
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-approve]`).click().should("not.exist");
        cy.on("window:confirm", () => false);
        cy.get(`[data-test=destroy-lineup]`).click();
        cy.get(`[data-test=member-${signups[0].user.id}]`).should("be.visible");
      });

      it("resets the lineup/signup information when user agrees", () => {
        cy.waitForFormInteractive();
        cy.get(`[data-test=member-${signups[0].user.id}] [data-test=person-approve]`).click().should("not.exist");
        cy.get(`[data-test=destroy-lineup]`).click();
        for (let person of signups) {
          cy.get(`[data-test=member-${person.user.id}]`).should("not.exist");
        }
        cy.reload();
        cy.waitForFormInteractive();
        for (let person of signups) {
          cy.get(`[data-test=member-${person.user.id}]`).should("not.exist");
        }
      });

      it("resets the instruments when the lineup information is destroyed", () => {
        cy.get(`[data-test=destroy-lineup]`).click();
        cy.get(`[data-test="select-box"]`).select("Huggable Treasurechest");
        cy.contains("Add user").click();
        cy.contains("Fiddle").should("not.exist");
        cy.reload();
        cy.waitForFormInteractive();
        cy.contains("Fiddle").should("not.exist");
      });
    });
  });

  context("not logged in", () => {
    it("isn't accessible", () => {
      cy.request({
        url: "/members/gigs/15274/edit-lineup",
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 401);
    });

    it("shows not logged in error on non existent gig", () => {
      cy.request({
        url: "/members/gigs/15275/edit-lineup",
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 401);
    });
  });

  context("authorized as normal user", () => {
    beforeEach(() => {
      cy.login("cypress_user", "abc123");
    });

    it("isn't accessible", () => {
      cy.request({
        url: "/members/gigs/15274/edit-lineup",
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 403);
    });
  });
});

let currentDate = Cypress.DateTime.local();

let signupAdminGigs = [
  {
    date: currentDate.minus({ weeks: 1 }),
    title: "Gone gig",
    allow_signups: false,
  },
  {
    date: currentDate.plus({ days: 2 }),
    title: "Soon gig",
    allow_signups: false,
  },
  {
    date: currentDate.plus({ weeks: 2 }),
    title: "Then gig",
    allow_signups: true,
  },
  {
    date: currentDate.plus({ weeks: 3 }),
    title: "Further gig",
    allow_signups: true,
  },
];

let signupAdminStatuses = [
  {
    first: "Sparkly",
    last: "Tiger",
    gigs: [
      { approved: true, user_available: true, user_only_if_necessary: false },
      { user_available: true, user_only_if_necessary: false },
      { approved: null, user_available: true, user_only_if_necessary: true },
      { approved: null, user_available: true, user_only_if_necessary: true },
    ],
    gig_notes: "Some general note about... something general?",
  },
  {
    first: "Teeny",
    last: "Mug",
    gigs: [null, { approved: true }, null, null],
  },
  {
    first: "Sleepy",
    last: "Prince",
    gigs: [
      { user_available: false },
      {
        approved: true,
        user_available: true,
        user_only_if_necessary: true,
        user_notes: "Need to be up early the next morning, so would rather not play this",
      },
      { user_available: true, user_only_if_necessary: false },
      null,
    ],
  },
  {
    first: "Floofy",
    last: "Beggar",
    gigs: [
      null,
      { user_available: false },
      { user_available: true, user_only_if_necessary: false, user_notes: "I have some notes for this gig" },
      { user_available: true, user_only_if_necessary: false, user_notes: "I have some different notes for this gig" },
    ],
    gig_notes: "I also have general notes",
  },
  {
    first: "L'il",
    last: "Cherio",
    gigs: [null, { user_available: true, user_only_if_necessary: true }, null, null],
  },
];

describe("signup admin", () => {
  let signupsToInsert;
  before(() => {
    let gigIds = [...Array(4).keys()].map((offset) => offset + 52347);
    for (let index in signupAdminGigs) {
      let gig = signupAdminGigs[index];
      gig.id = gigIds[index];
      cy.task("db:create_gig", { ...gig, admins_only: false, type: "1" });
      cy.task("db:delete_signups", { id: gig.id });
    }
    signupsToInsert = [];
    let userIdBase = 737632;
    for (let personIndex in signupAdminStatuses) {
      let person = signupAdminStatuses[personIndex];
      person.id = userIdBase + parseInt(personIndex);
      for (let gigIndex in signupAdminGigs) {
        let gigSignup = person.gigs[gigIndex];
        if (gigSignup) {
          gigSignup.gig = signupAdminGigs[gigIndex].id;
          signupsToInsert.push({
            user: {
              id: person.id.toString(),
              email: `user${person.id}@signup-adm.in`,
              username: `cypress_gig_signup_admin_u${person.id}`,
              admin: "9",
              first: person.first,
              last: person.last,
              gig_notes: person.gig_notes,
            },
            ...gigSignup,
          });
        }
      }
    }
    cy.task("db:create_lineup", { entries: signupsToInsert, gig_id: null });
  });

  it("is not accessible to normal users", () => {
    cy.login("cypress_user", "abc123");
    cy.request({ url: "/members/gigs/signups", failOnStatusCode: false }).its("status").should("eq", 403);
  });

  context("authorised as president", () => {
    beforeEach(() => {
      cy.login("cypress_president", "abc123");
      cy.visit("/members/gigs/signups");
      cy.get(`[data-test=tooltip-loaded]`).should("exist");
    });

    it("is accessible", () => {
      cy.contains("Then gig").should("be.visible");
      let peopleCount = null;
      cy.get("[data-test=person-name]").then((elements) => {
        let names = Cypress.$.map(elements, (e) => e.innerHTML);
        expect(names).to.have.length.at.least(signups.length).and.be.ascending;
        peopleCount = names.length;
      });
      cy.contains("Then gig").click();
      cy.get("[data-test=person-name]").then((elements) => {
        let names = Cypress.$.map(elements, (e) => e.innerHTML);
        expect(names).to.have.length(peopleCount).and.not.be.ascending;
      });
    });

    it("shows icons for signup status and notes", () => {
      cy.get("[data-test=signup-details-737635-52349] i").should("have.class", "la-check");
      cy.get("[data-test=signup-details-737635-52349] i").should("have.class", "la-comment");
      cy.get("[data-test=signup-details-737632-52350] i").should("have.class", "la-question");
      cy.get("[data-test=show-past-month]").click();
      cy.get("[data-test=signup-details-737634-52347] i").should("have.class", "la-times");
      cy.get("[data-test=signup-details-737634-52347] i").should("not.have.class", "la-comment");
      cy.get("[data-test=signup-details-737633-52348]").should("be.visible");
      cy.get("[data-test=signup-details-737633-52348] i").should("not.exist");
    });

    it("shows the correct gigs on each view", () => {
      cy.get("[data-test=gig-title-52347]").should("not.exist");
      cy.get("[data-test=gig-title-52348]").should("be.visible");
      cy.get("[data-test=gig-title-52349]").should("be.visible");
      cy.get("[data-test=gig-title-52350]").should("be.visible");
      cy.get("[data-test=show-upcoming-no-lineup]").click();
      cy.get("[data-test=gig-title-52347]").should("not.exist");
      cy.get("[data-test=gig-title-52348]").should("not.exist");
      cy.get("[data-test=gig-title-52349]").should("be.visible");
      cy.get("[data-test=gig-title-52350]").should("be.visible");
      cy.get("[data-test=show-past-month]").click();
      cy.get("[data-test=gig-title-52347]").should("be.visible");
      cy.get("[data-test=gig-title-52348]").should("be.visible");
      cy.get("[data-test=gig-title-52349]").should("be.visible");
      cy.get("[data-test=gig-title-52350]").should("be.visible");
    });

    it("sorts signups for different gigs", () => {
      cy.get("[data-test=gig-title-52348]").click();
      cy.get("[data-test=person-name]").then((elements) => {
        let names = Cypress.$.map(elements, (e) => e.innerHTML.replace(/&nbsp;/, " "));
        expect(names.slice(0, 2)).to.contain("Sleepy Prince", "Teeny Mug");
        expect(names.slice(2, 5)).to.eql(["Sparkly Tiger", "L'il Cherio", "Floofy Beggar"]);
      });
      cy.get("[data-test=gig-title-52349]").click();
      cy.get("[data-test=person-name]").then((elements) => {
        let names = Cypress.$.map(elements, (e) => e.innerHTML.replace(/&nbsp;/, " "));
        expect(names.slice(0, 2)).to.contain("Sleepy Prince", "Floofy Beggar");
        expect(names[2]).to.equal("Sparkly Tiger");
      });
    });

    it("sorts signups across different views", () => {
      cy.get("[data-test=gig-title-52348]").click();
      cy.get("[data-test=person-name]").then((elements) => {
        let names = Cypress.$.map(elements, (e) => e.innerHTML.replace(/&nbsp;/, " "));
        expect(names.slice(0, 2)).to.contain("Sleepy Prince", "Teeny Mug");
        expect(names.slice(2, 5)).to.eql(["Sparkly Tiger", "L'il Cherio", "Floofy Beggar"]);
      });
      cy.get("[data-test=show-past-month]").click();
      cy.get("[data-test=person-name]").then((elements) => {
        let names = Cypress.$.map(elements, (e) => e.innerHTML.replace(/&nbsp;/, " "));
        expect(names).to.be.ascending;
      });
      cy.get("[data-test=gig-title-52347]").click().should("have.attr", "aria-selected", "true");
      cy.get("[data-test=person-name]").then((elements) => {
        let names = Cypress.$.map(elements, (e) => e.innerHTML.replace(/&nbsp;/, " "));
        expect(names.slice(0, 2)).to.eql(["Sparkly Tiger", "Sleepy Prince"]);
      });
      cy.get("[data-test=gig-title-52349]").click();
      cy.get("[data-test=person-name]").then((elements) => {
        let names = Cypress.$.map(elements, (e) => e.innerHTML.replace(/&nbsp;/, " "));
        expect(names.slice(0, 2)).to.contain("Floofy Beggar", "Sleepy Prince");
        expect(names[2]).to.equal("Sparkly Tiger");
      });
      cy.get("[data-test=show-upcoming-no-lineup]").click();
      cy.get("[data-test=person-name]").then((elements) => {
        let names = Cypress.$.map(elements, (e) => e.innerHTML.replace(/&nbsp;/, " "));
        expect(names).to.be.ascending;
      });
      cy.get("[data-test=gig-title-52350]").click();
      cy.get("[data-test=person-name]").then((elements) => {
        let names = Cypress.$.map(elements, (e) => e.innerHTML.replace(/&nbsp;/, " "));
        expect(names.slice(0, 2)).to.eql(["Floofy Beggar", "Sparkly Tiger"]);
      });
      cy.get("[data-test=gig-title-52349]").click();
      cy.get("[data-test=person-name]").then((elements) => {
        let names = Cypress.$.map(elements, (e) => e.innerHTML.replace(/&nbsp;/, " "));
        expect(names.slice(0, 2)).to.contain("Floofy Beggar", "Sleepy Prince");
        expect(names[2]).to.equal("Sparkly Tiger");
      });
    });

    it("shows notes in tooltips if they exist", () => {
      cy.get("[data-test=gig-title-52349]").click();
      cy.get("[data-test=signup-details-737635-52349]").hasTooltip("Notes: I have some notes for this gig");
      cy.get("[data-test=signup-details-737635-52349]").hasTooltip("General notes: I also have general notes");
      cy.get("[data-test=signup-details-737634-52349]").click();
      cy.get("[data-test=signup-details-737634-52349]").tooltipContents().should("not.contain", "Notes");
      cy.get("[data-test=signup-details-737632-52349]").hasTooltip("General notes:");
      cy.get("[data-test=signup-details-737632-52349]").tooltipContents().should("not.contain", "Notes:");
      cy.get("[data-test=signup-details-737634-52348]").hasTooltip("Notes:");
      cy.get("[data-test=signup-details-737634-52348]").tooltipContents().should("not.contain", "General notes:");
    });
  });
});
