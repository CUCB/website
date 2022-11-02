import { fallbackPeople } from "./committee";
import { HexValue, ThemeColor } from "../components/Members/Customiser.svelte";
import { Day } from "../view";
import type { LayoutServerLoad } from "./$types";
import { CommitteeRT } from "./layout.types";
import type { Static } from "runtypes";
import type { ThemedProperty, Committee } from "./layout.types";

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

export const load: LayoutServerLoad = async function ({ url, fetch, locals }) {
  const downloadedCommittee = {};
  let session = { ...locals.session, save: undefined, destroy: undefined };

  try {
    const res = await fetch("/committee.json").then((r) => r.json());

    for (let person of res.committee) {
      // @ts-ignore
      downloadedCommittee[person.committee_key.name] = {
        ...person,
      };
    }
  } catch (e) {
    // Swallow error, we can generate generic committee details instead
  }

  const fallbackCommittee: Committee = CommitteeRT.check(
    Object.fromEntries(fallbackPeople.map((person) => [person.committee_key.name, person])),
  );

  const committee = { ...fallbackCommittee, ...downloadedCommittee };

  let query = url.searchParams;
  let color: Static<typeof ThemeColor>;
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

  return { settingsWithoutMaps: settings, committee, session };
};
