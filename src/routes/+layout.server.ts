import { makeClient } from "../graphql/client";
import { fallbackPeople } from "./_committee";
import { HexValue, ThemeColor } from "../components/Members/Customiser.svelte";
import type { Static } from "runtypes";
import { Day } from "../view";
import { client, clientCurrentUser } from "../graphql/client";
import type { LayoutServerLoad } from "./$types";

type ThemeColor = Static<typeof ThemeColor>;
type HexValue = Static<typeof HexValue>;
interface ThemedProperty {
  default?: HexValue;
  light?: HexValue;
  dark?: HexValue;
}

export interface CommitteeMember {
  name: string;
  casual_name: string;
  email_obfus: string;
  committee_key: { name: string; __typename: string };
  __typename: string;
}
export interface Committee {
  president: CommitteeMember;
  secretary: CommitteeMember;
  webmaster: CommitteeMember;
}

// TODO improve typing
function fromSessionTheme(session: { theme?: any } | null, name: string): string | undefined {
  if (session && session.theme && session.theme[name]) {
    try {
      return JSON.parse(session.theme[name]);
    } catch {
      return session.theme[name];
    }
  } else {
    return undefined;
  }
}

export const load: LayoutServerLoad = async function ({ request, url, fetch, locals, cookies }) {
  let committee = {};
  let session = { ...locals.session, save: undefined, destroy: undefined };

  try {
    const res = await fetch("/committee.json").then((r) => r.json());

    for (let person of res.committee) {
      // @ts-ignore
      committee[person.committee_key.name] = {
        ...person,
      };
    }
  } catch (e) {
    // Swallow error, we can generate generic committee details instead
  }

  let fallbackCommittee = {};
  for (let person of fallbackPeople) {
    // @ts-ignore
    fallbackCommittee[person.committee_key.name] = {
      ...person,
    };
  }

  committee = { ...fallbackCommittee, ...committee };

  let query = url.searchParams;
  let color: ThemeColor;
  try {
    color = ThemeColor.check(query.get("color") || fromSessionTheme(session, "color"));
  } catch {
    color = "default";
  }
  let dayFromSession = fromSessionTheme(session, "calendarStartDay");
  let settings = {
    accent: {} as ThemedProperty,
    logo: {} as ThemedProperty,
    color,
    font: query.get("font") || fromSessionTheme(session, "font") || "standard",
    spinnyLogo: fromSessionTheme(session, "spinnyLogo") || false,
    calendarStartDay: Day.guard(dayFromSession) ? dayFromSession : "mon",
  };
  let accent = query.get("accent") || fromSessionTheme(session, `accent_${color}`);
  if (HexValue.guard(accent)) {
    settings.accent[color] = accent;
  }
  let logo = query.get("logo") || fromSessionTheme(session, `logo_${color}`);
  if (HexValue.guard(logo)) {
    settings.logo[color] = logo;
  }

  client.set(makeClient(fetch));
  clientCurrentUser.set(makeClient(fetch, { role: "current_user" }));

  return { settingsWithoutMaps: settings, committee, session };
};
