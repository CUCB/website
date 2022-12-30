import { Literal, Union, String, type Static } from "runtypes";
import { Map, Record } from "immutable";
import type { Day } from "../../view";
export const ThemeColor = Union(Literal("default"), Literal("light"), Literal("dark"));
export const HexValue = String.withConstraint((s) => s.match(/^[A-F0-9]{6}$/i) !== null);

export type HexValue = Static<typeof HexValue>;
export type ThemeColor = Static<typeof ThemeColor>;
export type Font = "default" | "hacker";
export class Settings extends Record({
  color: "default" as ThemeColor,
  accent: Map() as Map<ThemeColor, HexValue>,
  logo: Map() as Map<ThemeColor, HexValue>,
  font: "default" as Font,
  calendarStartDay: "mon" as Day,
  spinnyLogo: false,
}) {}
