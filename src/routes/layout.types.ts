import type { Static } from "runtypes";
import type { HexValue, ThemeColor } from "../components/Members/runtypes";
import { Record, String } from "runtypes";

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
  lookup_name: Record({ name: String }),
});

export const CommitteeRT = Record({
  president: CommitteeMemberRT,
  secretary: CommitteeMemberRT,
  webmaster: CommitteeMemberRT,
});
