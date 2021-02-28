import { writable } from "svelte/store";

const NAME = `Cambridge University Ceilidh Band`;
export const makeTitle = (pageTitle) => `${pageTitle} | ${NAME}`;
export const committee = writable(null);

const hexToRgb = (hex) => {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
};
const colorTriple = (color) => hexToRgb(color).join(", ");
export const accentCss = (color) =>
  ((color && hexToRgb(color)) || "") &&
  `<style>:root{--accent: #${color}; --accent_triple: ${colorTriple(color)};}</style>`;
export const logoCss = (logo) => ((logo && hexToRgb(logo)) || "") && `<style>:root{--logo_color: #${logo};}</style>`;
export const calendarStartDay = writable("mon");
export const themeName = writable("");

export const suffix = (n) =>
  ({ one: "st", two: "nd", few: "rd", other: "th" }[new Intl.PluralRules("en-gb", { type: "ordinal" }).select(n)]);

export const createValidityChecker = () => {
  let bothPresentFields = {};
  let bothEqualFields = {};

  return (node, options) => {
    if (options.bothPresent) {
      if (!bothPresentFields[options.bothPresent.id]) {
        bothPresentFields[options.bothPresent.id] = [];
      }
      bothPresentFields[options.bothPresent.id].push(node);
    }
    if (options.bothEqual) {
      if (!bothEqualFields[options.bothEqual.id]) {
        bothEqualFields[options.bothEqual.id] = [];
      }
      bothEqualFields[options.bothEqual.id].push(node);
    }
    const changeHandler = () => {
      if (options.validityErrors) {
        for (let key of Object.keys(options.validityErrors)) {
          if (node.validity[key]) {
            node.setCustomValidity(options.validityErrors[key]);
            return;
          }
        }
      }

      node.setCustomValidity("");

      if (options.bothPresent) {
        let presence = bothPresentFields[options.bothPresent.id].map((field) => field.value.length > 0);
        if (!presence.every((x) => x) && !presence.every((x) => !x)) {
          // If either all present or all empty...
          for (let field of bothPresentFields[options.bothPresent.id]) {
            if (!field.value.length) {
              field.setCustomValidity(options.bothPresent.error);
            }
          }
          return;
        }
        for (let field of bothPresentFields[options.bothPresent.id]) {
          if (field.validationMessage === options.bothPresent.error) {
            field.setCustomValidity("");
            field.dispatchEvent(new Event("change"));
          }
        }
      }

      if (options.bothEqual) {
        let allValues = bothEqualFields[options.bothEqual.id].map((field) => field.value);
        if (!allValues.every((v) => v === allValues[0])) {
          bothEqualFields[options.bothEqual.id].map((field) => {
            field.setCustomValidity(options.bothEqual.error);
          });
          return;
        }

        for (let field of bothEqualFields[options.bothEqual.id]) {
          if (field.validationMessage === options.bothEqual.error) {
            field.setCustomValidity("");
            field.dispatchEvent(new Event("change"));
          }
        }
      }
    };

    node.addEventListener("change", changeHandler);

    return {
      destroy() {
        node.removeEventListener("change", changeHandler);
      },
    };
  };
};
