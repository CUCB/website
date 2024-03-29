import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
import { Literal, Union } from "runtypes";
import type { Static } from "runtypes";
import { Map, List } from "immutable";

const NAME = `Cambridge University Ceilidh Band`;
export const makeTitle = (pageTitle?: string) => (pageTitle ? `${pageTitle} | ${NAME}` : NAME);
export const committee: Writable<any | null> = writable(null);
export const Day = Union(
  Literal("mon"),
  Literal("tue"),
  Literal("wed"),
  Literal("thu"),
  Literal("fri"),
  Literal("sat"),
  Literal("sun"),
);
export type Day = Static<typeof Day>;

const hexToRgb = (hex: string) => {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
};
const colorTriple = (color: string) => hexToRgb(color)?.join(", ");
export const accentCss = (color: string) =>
  ((color && hexToRgb(color)) || "") &&
  `<style>:root{--accent: #${color}; --accent_triple: ${colorTriple(color)};}</style>`;
export const logoCss = (logo: string) =>
  ((logo && hexToRgb(logo)) || "") && `<style>:root{--logo_color: #${logo};}</style>`;
export const calendarStartDay: Writable<Day> = writable("mon");
export const themeName = writable("");

const suffixes = { one: "st", two: "nd", few: "rd", other: "th" } as const;

export const suffix = (n: number) =>
  suffixes[new Intl.PluralRules("en-gb", { type: "ordinal" }).select(n) as keyof typeof suffixes];

interface ValidityErrors {
  badInput?: string;
  customError?: string;
  patternMismatch?: string;
  rangeOverflow?: string;
  rangeUnderflow?: string;
  stepMismatch?: string;
  tooLong?: string;
  tooShort?: string;
  typeMismatch?: string;
  valid?: string;
  valueMissing?: string;
}

interface ValidityOptions {
  bothPresent?: { id: string; error: string };
  bothEqual?: { id: string; error: string };
  validityErrors?: ValidityErrors;
}

export const createValidityChecker = () => {
  let bothPresentFields: Map<string, List<HTMLInputElement>> = Map();
  let bothEqualFields: Map<string, List<HTMLInputElement>> = Map();

  return (node: HTMLInputElement, options: ValidityOptions) => {
    if (options.bothPresent) {
      if (!bothPresentFields.has(options.bothPresent.id)) {
        bothPresentFields = bothPresentFields.set(options.bothPresent.id, List([node]));
      } else {
        bothPresentFields = bothPresentFields.update(options.bothPresent.id, (nodes) =>
          (nodes as List<HTMLInputElement>).push(node),
        );
      }
    }
    if (options.bothEqual) {
      if (!bothEqualFields.has(options.bothEqual.id)) {
        bothEqualFields = bothEqualFields.set(options.bothEqual.id, List([node]));
      } else {
        bothEqualFields = bothEqualFields.update(options.bothEqual.id, (nodes) =>
          (nodes as List<HTMLInputElement>).push(node),
        );
      }
    }
    const changeHandler = () => {
      if (options.validityErrors) {
        for (const [key, message] of Object.entries(options.validityErrors)) {
          if (node.validity[key as keyof ValidityErrors]) {
            node.setCustomValidity(message);
            return;
          }
        }
      }

      node.setCustomValidity("");

      if (options.bothPresent) {
        const fields = bothPresentFields.get(options.bothPresent.id);
        if (fields) {
          let presence = fields.map((field) => field.value.length > 0);
          if (!presence.every((x) => x) && !presence.every((x) => !x)) {
            // If either all present or all empty...
            for (let field of fields) {
              if (!field.value.length) {
                field.setCustomValidity(options.bothPresent.error);
              }
            }
            return;
          }

          for (let field of fields) {
            if (field.validationMessage === options.bothPresent.error) {
              field.setCustomValidity("");
              field.dispatchEvent(new Event("change"));
            }
          }
        }
      }

      if (options.bothEqual) {
        const fields = bothEqualFields.get(options.bothEqual.id);
        if (fields) {
          let allValues = fields.map((field) => field.value);
          if (!allValues.every((v) => v === allValues.get(0))) {
            for (let field of fields) {
              field.setCustomValidity(options.bothEqual.error);
            }
            return;
          }

          for (let field of fields) {
            if (field.validationMessage === options.bothEqual.error) {
              field.setCustomValidity("");
              field.dispatchEvent(new Event("change"));
            }
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
