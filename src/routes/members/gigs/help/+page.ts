import { assertLoggedIn } from "../../../../client-auth";
import { UPDATE_GIG_DETAILS } from "$lib/permissions";
import type { PageLoad } from "./$types";
export const load: PageLoad = async ({ fetch, parent, url }) => {
  const { session } = await parent();
  assertLoggedIn(session);
  let calendarLinks = await (await fetch("/members/gigs/calendar/links")).json();

  const canEditGigs = UPDATE_GIG_DETAILS.guard(session);
  const scheme = url.host == "localhost" || url.host.startsWith("localhost:") ? "http" : "https";
  return { canEditGigs, calendarLinks, scheme, host: url.host };
};
