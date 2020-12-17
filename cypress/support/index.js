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

chai.use(chaiSorted);

const equalColor = (_chai, utils) => {
  function assertEqualColor(options) {
    let objectColor = tinycolor(this._obj.css("color")).toHexString();
    this.assert(
      objectColor === tinycolor(options).toHexString(),
      `expected #{this} to have color "${tinycolor(options).toHexString()}". actual color is "${objectColor}".`,
      `expected #{this} to not have color "${tinycolor(options).toHexString()}". actual color is "${objectColor}".`,
      this._obj,
    );
  }

  _chai.Assertion.addChainableMethod("color", assertEqualColor);
};

chai.use(equalColor);

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
    let recipients = this._obj.To.map(recipient => `${recipient.Mailbox}@${recipient.Domain}`);
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
