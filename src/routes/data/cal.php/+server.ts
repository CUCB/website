import { DateTime } from "luxon";
import pkg from "ical-generator";
import dotenv from "dotenv";
import crypto from "crypto";
import { sortLineup } from "../../../components/Gigs/sort";
import { error } from "@sveltejs/kit";
import orm from "$lib/database";
import { CalendarSubscription, CalendarSubscriptionType } from "$lib/entities/CalendarSubscription";
import { env } from "$env/dynamic/private";
import type { RequestEvent } from "./$types";
import { fetchMultiGigSummary, fetchSpecificGigSummary } from "../../members/gigs/queries";
import { VIEW_GIG_ADMIN_NOTES } from "$lib/permissions";
import type { GigSummary } from "../../members/types";
import { User } from "$lib/entities/User";
// @ts-ignore
const { ICalCalendar, ICalCalendarMethod } = pkg;

dotenv.config();

const CALENDAR_SECRET = env["CALENDAR_SECRET"];

function applyTimezone(date: string | Date): string {
  if (typeof date === "string") {
    return DateTime.fromISO(date).setZone("Europe/London").toISO({ includeOffset: false });
  } else {
    return DateTime.fromJSDate(date).setZone("Europe/London").toISO({ includeOffset: false });
  }
}

function startEndTimes(gig: GigSummary): { start: string; end: string | null } {
  let start = gig.arrive_time && applyTimezone(gig.arrive_time);
  let end = (gig.finish_time && applyTimezone(gig.finish_time)) ?? null;
  if (start === end || end === null || start === null) {
    // Either an all day event, or we don't have both start and finish times, so make it appear as an all day event
    // @ts-ignore
    if (gig.date != null) {
      start = DateTime.fromJSDate(gig.date).toISO({ includeOffset: false });
    }
    end = null;
  }
  return { start: start as string, end };
}

function linkTo(gig: GigSummary, baseUrl: string): string {
  return `${baseUrl}/members/gigs/${gig.id}`;
}

function authFor({ type, gig, uid }: { type: string; gig?: string | null; uid: string }): string {
  return crypto
    .createHash("md5")
    .update(Buffer.from(`${CALENDAR_SECRET}${uid}type=${type}${gig ? `&gig=${gig}` : ""}`))
    .digest("hex");
}

function testAuthLink(query: URLSearchParams): string | null {
  try {
    const type = query.get("type");
    const gig = query.get("gig");
    const uid = query.get("_cal_uid");
    const a = query.get("_cal_auth");

    if (type && uid) {
      const auth = authFor({ type, gig, uid });

      return auth == a ? uid : null;
    } else {
      throw error(404, "Invalid query parameters");
    }
  } catch (e) {
    // TODO better error
    console.trace(e);
    throw error(404, "Invalid query parameters");
  }
}

class GigCalendar {
  baseUrl: string;
  calendar: typeof ICalCalendar;
  // TODO does the secret actually want to be stored in the code??
  constructor(name: string, description: string, baseUrl: string) {
    this.baseUrl = baseUrl;
    this.calendar = new ICalCalendar({
      name,
      timezone: "Europe/London",
      method: ICalCalendarMethod.PUBLISH,
      description,
    });
  }

  generate() {
    return this.calendar.toString();
  }

  addGig(gig: GigSummary) {
    const { start, end } = startEndTimes(gig);
    let description = `[Correct as of ${DateTime.local().toHTTP()}.]`;
    const times = [
      gig.time &&
        `| Time: ${DateTime.fromISO(`1970-01-01T${gig.time}`).toLocaleString(DateTime.TIME_24_SIMPLE) || ""}`.trim(),
    ];
    if (gig.arrive_time) {
      times.push(`Arrive ${DateTime.fromJSDate(gig.arrive_time).toLocaleString(DateTime.TIME_24_SIMPLE)}`);
    }
    if (gig.finish_time) {
      times.push(`Finish ${DateTime.fromJSDate(gig.finish_time).toLocaleString(DateTime.TIME_24_SIMPLE)}`);
    }
    description += `\n${times.join(" | ")}`;
    description += `\n${gig.summary || "No summary available"}`;
    description += `\n${linkTo(gig, this.baseUrl)}`;
    if (gig.notes_band) {
      description += `\nOTHER INFO: ${gig.notes_band}`;
    }
    if (gig.notes_admin) {
      description += `\nADMIN NOTES: ${gig.notes_admin}`;
    }
    if (gig.contacts?.length > 0) {
      const names = [];
      for (let contact of gig.contacts) {
        names.push(contact.contact.name + (contact.client ? " (client)" : "") + (contact.calling ? " (caller)" : ""));
      }
      description += `\nCONTACT: ${names.join(", ")}`;
    }

    sortLineup(gig.lineup);
    let emails = [];
    let lineup = [];
    for (let person of gig.lineup) {
      let instrumentNames = person.user_instruments.map((i) => i.user_instrument.instrument.name);
      let instrumentList = instrumentNames.length && `[${instrumentNames.join(", ")}]`;
      let fullName = `${person.user.first} ${person.user.last}`;

      // TODO should it say who's leading etc.?

      if (person.user.email) {
        emails.push(person.user.email);
      }
      lineup.push(`${fullName}: ${instrumentList || "?"}`);
    }
    if (emails.length > 0) {
      description += `\n| E-mails: ${emails.join(", ")}`;
    }
    if (lineup.length > 0) {
      description += `\n| Lineup: ${lineup.join(", ")}`;
    }
    this.calendar.createEvent({
      summary: `GIG: ${gig.title}`,
      start,
      allDay: !end,
      end,
      description,
    });
  }
}

// TODO de-duplicate these functions, they're blindly copied and pasted from the user profile page
// TODO use these more widely too, they improve performance as we don't wait for the first query to fail before trying the next
function fulfilledFirst<T>(a: PromiseSettledResult<T>, b: PromiseSettledResult<T>): number {
  if (a.status == "fulfilled") {
    return b.status == "fulfilled" ? 0 : -1;
  } else {
    return b.status == "fulfilled" ? 1 : 0;
  }
}

// Ideally this wouldn't wait for the later promises if the earlier onces succeed, but Promise.allSettled is the nicest API
// I could find to achieve what I wanted
async function firstSuccess<T>(promises: Promise<T>[]): Promise<T | null> {
  const bestResult = (await Promise.allSettled(promises)).sort(fulfilledFirst)?.[0];
  if (bestResult.status == "fulfilled") {
    return bestResult.value;
  } else {
    throw bestResult.reason;
  }
}

type Session = { firstName: string; lastName: string; role: string; userId: string };

async function allGigs(ipAddress: string, baseUrl: string, session: Session) {
  const twoDaysAgo = DateTime.local().minus({ days: 2 }).toISO();
  const gigs = await fetchMultiGigSummary(session, {
    $or: [{ date: { $gte: twoDaysAgo } }, { arrive_time: { $gte: twoDaysAgo } }],
    // TODO define some constants so that I don't keep putting type: "1" everywhere
    type: "1",
  });
  const hidden = VIEW_GIG_ADMIN_NOTES.guard(session);
  const update = (await orm()).em.fork().upsert(CalendarSubscription, {
    calendarType: CalendarSubscriptionType.allgigs,
    ipAddress,
    user: session.userId,
    lastAccessed: "now()" as unknown as Date,
  });
  const fullName = `${session.firstName} ${session.lastName}`;

  // TODO factor out some of this since it's basically identical to mygigs
  const calendar = new GigCalendar(
    `CUCB: ${fullName}'s Gig Feed`,
    `Auto-generated CUCB gig feed, generated for the\
    ${hidden ? " privileged" : ""} user ${fullName} of all upcoming \
    (and very recent) CUCB gigs. Notice that depending on how you use this \
    calendar, it might not sync, sync maybe daily [Google URL feed], or sync \
    more frequently. [This description retrieved ${DateTime.local().toHTTP()}.]`,
    baseUrl,
  );
  for (let gig of gigs) {
    calendar.addGig(gig);
  }
  try {
    await update;
  } catch (e) {
    console.trace(e);
    // TODO this should probably be handled differently
    // should it even be an error?
    // it should probably notify the webmaster?
    throw error(500, "Something went wrong");
  }
  return calendar.generate();
}

async function myGigs(ipAddress: string, baseUrl: string, session: Session) {
  const twoDaysAgo = DateTime.local().minus({ days: 2 }).toISO();
  const userGigs = await (await orm()).em.fork().findOne(
    User,
    {
      id: session.userId,
      gigLineups: {
        approved: true,
        gig: { $or: [{ date: { $gte: twoDaysAgo } }, { arrive_time: { $gte: twoDaysAgo } }] },
      },
    },
    { fields: ["gigLineups", "gigLineups.gig"] },
  );
  const hidden = VIEW_GIG_ADMIN_NOTES.guard(session);
  const em = (await orm()).em.fork();
  const update = em.upsert(CalendarSubscription, {
    calendarType: CalendarSubscriptionType.mygigs,
    ipAddress,
    user: session.userId,
    lastAccessed: "now()" as unknown as Date,
  });
  const fullName = `${session.firstName} ${session.lastName}`;

  const calendar = new GigCalendar(
    `CUCB: ${fullName}'s Gig Feed`,
    `Auto-generated CUCB gig feed, generated for the\
    ${hidden ? " privileged" : ""} user ${fullName} of all upcoming (and very recent) \
    CUCB gigs they're performing in. Notice that depending on how you use this calendar, \
    it might not sync, sync maybe daily [Google URL feed], or sync more frequently. \
    [This description retrieved ${DateTime.local().toHTTP()}.]`,
    baseUrl,
  );
  if (userGigs) {
    const ids = userGigs.gigLineups.toArray().map((entry) => entry.gig.id);
    const gigs = await fetchMultiGigSummary(session, { id: { $in: ids } });
    for (const gig of gigs) {
      calendar.addGig(gig);
    }
  }
  try {
    await update;
  } catch (e) {
    console.trace(e);
    throw error(500, "Something went wrong");
  }
  return calendar.generate();
}

async function singleGig(gig_id: string | null, baseUrl: string, session: Session) {
  if (gig_id) {
    const gig = await fetchSpecificGigSummary(session, gig_id);

    const calendar = new GigCalendar(
      `Gig: ${gig.title} [${gig_id}]`,
      `Auto-generated information for gig ID ${gig_id}`,
      baseUrl,
    );

    calendar.addGig(gig);
    return calendar.generate();
  } else {
    throw error(404, "Missing gig id");
  }
}

function calendarUrl(params: URLSearchParams): string {
  return `/data/cal.php?${params.toString()}`;
}

export function _gigCalendarUrl(gig: string, user_id: string): string {
  const params = new URLSearchParams({
    type: "gig",
    gig: gig,
    _cal_uid: user_id,
    _cal_auth: authFor({ type: "gig", gig, uid: user_id }),
  });
  return calendarUrl(params);
}

export function _allgigsCalendarUrl(user_id: string): string {
  const params = new URLSearchParams({
    type: "allgigs",
    _cal_uid: user_id.toString(),
    _cal_auth: authFor({ type: "allgigs", uid: user_id }),
  });
  return calendarUrl(params);
}

export function _mygigsCalendarUrl(user_id: string): string {
  const params = new URLSearchParams({
    type: "mygigs",
    _cal_uid: user_id.toString(),
    _cal_auth: authFor({ type: "mygigs", uid: user_id }),
  });
  return calendarUrl(params);
}

export async function GET({ url, request }: RequestEvent): Promise<Response> {
  let { host, "x-forwarded-proto": proto, "x-forwarded-for": ipAddress } = Object.fromEntries(request.headers);
  if (!ipAddress) {
    ipAddress = request.headers.get("x-real-ip") || "127.0.0.1";
    proto = "http";
  }
  const baseUrl = `${proto}://${host}`;
  const userId = testAuthLink(url.searchParams);
  // TODO add test for this
  if (!userId) {
    throw error(401, "Incorrect token");
  }

  const user = await (await orm()).em.fork().findOne(User, { id: userId });
  let session: Session;
  if (user) {
    session = { firstName: user.first, lastName: user.last, userId: user.id, role: user.adminType.role };
  } else {
    throw error(401, "Unknown user");
  }

  let body, filename;
  try {
    switch (url.searchParams.get("type")) {
      case "gig":
        body = await singleGig(url.searchParams.get("gig"), baseUrl, session);
        filename = `gig${url.searchParams.get("gig")}.ics`;
        break;
      case "allgigs":
        body = await allGigs(ipAddress, baseUrl, session);
        filename = `allgigs.ics`;
        break;
      case "mygigs":
        body = await myGigs(ipAddress, baseUrl, session);
        filename = `mygigs.ics`;
        break;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }

  dotenv.config();

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=UTF-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // These are all just copied from the old PHP code. I assume they do the right thing
      Expires: "Mon, 26 Jul 1997 05:00:00 GMT",
      "Last-Modified": DateTime.local().toHTTP(),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
    status: 200,
  });
}
