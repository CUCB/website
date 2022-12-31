import { fallbackPeople } from "./committee";
import { HexValue, ThemeColor } from "../components/Members/runtypes";
import { Day } from "../view";
import type { LayoutServerLoad } from "./$types";
import { CommitteeRT, type CommitteeMember } from "./layout.types";
import type { Static } from "runtypes";
import type { ThemedProperty, Committee } from "./layout.types";
import { IMPERSONATE_OTHER_ROLES } from "../lib/permissions";
import orm from "$lib/database";
import { wrap } from "@mikro-orm/core";
import { AuthUserType } from "../lib/entities/AuthUserType";

// TODO improve typing
function fromSessionTheme(session: { theme?: Record<string, string> } | null, name: string): string | undefined {
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
  const downloadedCommittee: Record<string, CommitteeMember> = {};
  let session = {
    ...locals.session,
    save: undefined,
    destroy: undefined,
  };

  try {
    const res: { committee: CommitteeMember[] } = await fetch("/committee.json").then((r) => r.json());

    for (let person of res.committee) {
      downloadedCommittee[person.lookup_name.name] = {
        ...person,
      };
    }
  } catch (e) {
    // Swallow error, we can generate generic committee details instead
  }

  const fallbackCommittee: Committee = CommitteeRT.check(
    Object.fromEntries(fallbackPeople.map((person) => [person.lookup_name.name, person])),
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

  let alternativeRole: string | null = null;
  let alternativeRoles: AlternativeRole[] | undefined = undefined;
  if (IMPERSONATE_OTHER_ROLES.guard(session)) {
    alternativeRole = session?.alternativeRole || null;
    alternativeRoles = await (
      await orm()
    ).em
      .fork()
      .find(AuthUserType, {}, { orderBy: { id: "ASC" } })
      .then((e) => e.map((e) => wrap(e).toPOJO()));
  }

  return { settingsWithoutMaps: settings, committee, optionalSession: session, alternativeRoles, alternativeRole };
};

interface AlternativeRole {
  id: string;
  title: string;
  role: string;
}
