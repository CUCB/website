import { assertLoggedIn } from "../../../../client-auth";
import { UPDATE_GIG_DETAILS } from "$lib/permissions";
import type { PageLoad } from "./$types";
import { Record, String } from "runtypes";

const calendarLinksTy = Record({ allgigs: String, mygigs: String });

export const load: PageLoad = async ({ fetch, parent, url }) => {
  const { session } = await parent();
  assertLoggedIn(session);
  let calendarLinks = calendarLinksTy.check(await (await fetch("/members/gigs/calendar/links")).json());

  const canEditGigs = UPDATE_GIG_DETAILS.guard(session);
  const scheme = url.host == "localhost" || url.host.startsWith("localhost:") ? "http" : "https";
  return { canEditGigs, calendarLinks, scheme, host: url.host };
};
