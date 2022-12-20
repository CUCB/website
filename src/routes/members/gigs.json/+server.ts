import { error, json } from "@sveltejs/kit";
import { DateTime } from "luxon";
import { Record, String } from "runtypes";
import { NOT_MUSIC_ONLY } from "$lib/permissions";
import { fetchMultiGigSummary, inMonth } from "../gigs/queries";
import type { RequestEvent } from "./$types";

const MonthString = String.withConstraint((s) => s.match(/^[1-9][0-9]{3}-[01][0-9]$/) !== null);

const InMonth = Record({ inMonth: MonthString });

export const GET = async ({ url, locals: { session } }: RequestEvent): Promise<Response> => {
  if (NOT_MUSIC_ONLY.guard(session)) {
    const params = Object.fromEntries(url.searchParams.entries());
    if (InMonth.guard(params)) {
      const month = DateTime.fromFormat(params.inMonth, "yyyy-LL");
      const gigs = await fetchMultiGigSummary(session, inMonth(month));

      return json(gigs);
    } else {
      throw error(404, "Unrecognised query");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
