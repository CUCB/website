// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import "./commands";
import tinycolor from "../deps/tinycolor";
import chaiSorted from "chai-sorted";
import { DateTime, Settings } from "luxon";
import "@percy/cypress";
import "cypress-plugin-tab";

Settings.defaultZoneName = "Europe/London";

Cypress.DateTime = DateTime;
chai.use(chaiSorted);

const equalColor = (_chai, utils) => {
  function assertEqualColor(options: string | string[]) {
    // TODO handle undefined better
    const objectColor = tinycolor(this._obj.css("color")).toHexString();
    const colors = Array.isArray(options) ? options : [options];
    this.assert(
      colors.map((color) => tinycolor(color).toHexString()).includes(objectColor),
      `expected #{this} to have color in "${colors}". actual color is "${objectColor}".`,
      `expected #{this} to not have color in "${colors}". actual color is "${objectColor}".`,
      this._obj,
    );
  }

  _chai.Assertion.addChainableMethod("color", assertEqualColor);
};

chai.use(equalColor);

const equalStroke = (_chai, utils) => {
  function assertEqualStroke(options: string | string[]) {
    let objectColor = tinycolor(this._obj.css("stroke")).toHexString();
    const colors = Array.isArray(options) ? options : [options];
    this.assert(
      colors.map((color) => tinycolor(color).toHexString()).includes(objectColor),
      `expected #{this} to have stroke color "${colors}". actual stroke color is "${objectColor}".`,
      `expected #{this} to not have stroke color "${colors}". actual stroke color is "${objectColor}".`,
      this._obj,
    );
  }

  _chai.Assertion.addChainableMethod("stroke", assertEqualStroke);
};

chai.use(equalStroke);

const emailFrom = (_chai, utils) => {
  function assertEmailFrom(expected) {
    let actual = `${this._obj.From.Mailbox}@${this._obj.From.Domain}`;
    this.assert(
      actual === expected,
      `expected #{this} to be from "${expected}". actual sender is "${actual}".`,
      `expected #{this} to not be from "${expected}". actual sender is "${actual}".`,
      this._obj,
    );
  }

  _chai.Assertion.addChainableMethod("sentFrom", assertEmailFrom);
};

chai.use(emailFrom);

const emailTo = (_chai, utils) => {
  function assertEmailTo(expected) {
    let recipients = this._obj.To.map((recipient) => `${recipient.Mailbox}@${recipient.Domain}`);
    this.assert(
      recipients.indexOf(expected) > -1,
      `expected #{this} to be sent to "${expected}". actual recipients are "${recipients}".`,
      `expected #{this} to not be sent to "${expected}". actual recipients are "${recipients}".`,
      this._obj,
    );
  }

  _chai.Assertion.addChainableMethod("sentTo", assertEmailTo);
};

chai.use(emailTo);

const emailReplyTo = (_chai, utils) => {
  function emailReplyTo() {
    return this._obj.Content["Reply-To"];
  }

  _chai.Assertion.addProperty("replyTo", emailReplyTo);
};

chai.use(emailReplyTo);

const regexCSS = (_chai, utils) => {
  function assertRegexCSS(property, expected) {
    this.assert(
      this._obj.css(property) && this._obj.css(property).match(expected),
      `expected #{this} to have CSS ${property} matching ${expected}, actual value is ${JSON.stringify(
        this._obj.css(property),
      )}.`,
      `expected #{this} to not have CSS ${property} matching ${expected}, actual value is ${JSON.stringify(
        this._obj.css(property),
      )}.`,
    );
  }

  _chai.Assertion.addChainableMethod("regexCSS", assertRegexCSS);
};

chai.use(regexCSS);
