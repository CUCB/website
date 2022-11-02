import type { Static } from "runtypes";
import type { HexValue, ThemeColor } from "../components/Members/Customiser.svelte";
import { Record, String } from "runtypes";

export type ThemeColor = Static<typeof ThemeColor>;
export type HexValue = Static<typeof HexValue>;
export interface ThemedProperty {
  default?: HexValue;
  light?: HexValue;
  dark?: HexValue;
}

export type CommitteeMember = Static<typeof CommitteeMemberRT>;
export type Committee = Static<typeof CommitteeRT>;

export const CommitteeMemberRT = Record({
  name: String,
  casual_name: String,
  email_obfus: String,
  committee_key: Record({ name: String, __typename: String }),
  __typename: String,
});

export const CommitteeRT = Record({
  president: CommitteeMemberRT,
  secretary: CommitteeMemberRT,
  webmaster: CommitteeMemberRT,
});
