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

const _equalColor = (_chai, utils) => {
  function assertEqualColor(options) {
    this.assert(
      tinycolor(this._obj).toHexString() === tinycolor(options).toHexString(),
      `expected #{this} to have color "${tinycolor(options).toHexString()}"`,
      `expected #{this} to not have color "${tinycolor(options).toHexString()}"`,
      this._obj,
    );
  }

  _chai.Assertion.addMethod("equalColor", assertEqualColor);
};
const equalColor = (_chai, utils) => {
  function assertEqualColor(options) {
    let objectColor = tinycolor(this._obj.css("color")).toHexString();
    this.assert(
      objectColor === tinycolor(options).toHexString(),
      `expected #{this} to have color "${tinycolor(options).toHexString()}. Actual color is ${objectColor}."`,
      `expected #{this} to not have color "${tinycolor(options).toHexString()} Actual color is ${objectColor}."`,
      this._obj,
    );
  }

  _chai.Assertion.addChainableMethod("color", assertEqualColor);
};

chai.use(equalColor);
