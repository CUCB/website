import { Writable, writable } from "svelte/store";
import { Literal, Union } from "runtypes";
import type { Static } from "runtypes";
// import type { Committee } from "./routes/_layout.svelte";

const NAME = `Cambridge University Ceilidh Band`;
export const makeTitle = (pageTitle?: string) => pageTitle ? `${pageTitle} | ${NAME}` : NAME;
export const committee: Writable<any | null> = writable(null);
export const Day = Union(Literal("mon"), Literal("tue"), Literal("wed"), Literal("thu"), Literal("fri"), Literal("sat"), Literal("sun"));
export type Day = Static<typeof Day>;

// @ts-ignore
const hexToRgb = (hex) => {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
// @ts-ignore
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
};
// @ts-ignore
const colorTriple = (color) => hexToRgb(color).join(", ");
// @ts-ignore
export const accentCss = (color) =>
  ((color && hexToRgb(color)) || "") &&
  `<style>:root{--accent: #${color}; --accent_triple: ${colorTriple(color)};}</style>`;
// @ts-ignore
export const logoCss = (logo) => ((logo && hexToRgb(logo)) || "") && `<style>:root{--logo_color: #${logo};}</style>`;
export const calendarStartDay: Writable<Day> = writable("mon");
export const themeName = writable("");

// @ts-ignore
export const suffix = (n) =>
// @ts-ignore
  ({ one: "st", two: "nd", few: "rd", other: "th" }[new Intl.PluralRules("en-gb", { type: "ordinal" }).select(n)]);

export const createValidityChecker = () => {
  let bothPresentFields = {};
  let bothEqualFields = {};

// @ts-ignore
  return (node, options) => {
    if (options.bothPresent) {
// @ts-ignore
      if (!bothPresentFields[options.bothPresent.id]) {
// @ts-ignore
        bothPresentFields[options.bothPresent.id] = [];
      }
// @ts-ignore
      bothPresentFields[options.bothPresent.id].push(node);
    }
    if (options.bothEqual) {
// @ts-ignore
      if (!bothEqualFields[options.bothEqual.id]) {
// @ts-ignore
        bothEqualFields[options.bothEqual.id] = [];
      }
// @ts-ignore
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
// @ts-ignore
        let presence: boolean[] = bothPresentFields[options.bothPresent.id].map((field) => field.value.length > 0);
        if (!presence.every((x) => x) && !presence.every((x) => !x)) {
          // If either all present or all empty...
// @ts-ignore
          for (let field of bothPresentFields[options.bothPresent.id]) {
            if (!field.value.length) {
              field.setCustomValidity(options.bothPresent.error);
            }
          }
          return;
        }
// @ts-ignore
        for (let field of bothPresentFields[options.bothPresent.id]) {
          if (field.validationMessage === options.bothPresent.error) {
            field.setCustomValidity("");
            field.dispatchEvent(new Event("change"));
          }
        }
      }

      if (options.bothEqual) {
// @ts-ignore
        let allValues = bothEqualFields[options.bothEqual.id].map((field) => field.value);
// @ts-ignore
        if (!allValues.every((v) => v === allValues[0])) {
// @ts-ignore
          bothEqualFields[options.bothEqual.id].map((field) => {
            field.setCustomValidity(options.bothEqual.error);
          });
          return;
        }

// @ts-ignore
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
