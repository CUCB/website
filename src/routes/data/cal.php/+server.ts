import { DateTime } from "luxon";
import icalPkg from "ical-generator";
import {
  gigAdminGuard,
  MyGigsFrom,
  AdminMyGigsFrom,
  UpdateLastCalendarAccess,
  AllGigsFrom,
  AdminAllGigsFrom,
  AdminSingleGig,
  SingleGig,
} from "../../../graphql/gigs/calendar";
import { GraphQLClient, handleErrors } from "../../../graphql/client";
import dotenv from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sortLineup } from "../../../components/Gigs/_sort";
import { error } from "@sveltejs/kit";
import orm from "$lib/database";
import { CalendarSubscription } from "$lib/entities/CalendarSubscription";
import type { CalendarSubscriptionType } from "$lib/entities/CalendarSubscriptionType";
import { env } from "$env/dynamic/private";
const { ICalCalendar, ICalCalendarMethod } = icalPkg;

dotenv.config();

const SESSION_SECRET_HASH = crypto
  .createHash("sha512")
  .update(Buffer.from(env["SESSION_SECRET"] as string))
  .digest("hex");

const CALENDAR_SECRET = env["CALENDAR_SECRET"];

function applyTimezone(date: string): string {
  return DateTime.fromISO(date).setZone("Europe/London").toISO({ includeOffset: false });
}

function startEndTimes(gig) {
  let start = applyTimezone(gig.arrive_time);
  let end = applyTimezone(gig.finish_time);
  if (start === end || end === null || start === null) {
    // Either an all day event, or we don't have both start and finish times, so make it appear as an all day event
    start = gig.date;
    end = null;
  }
  return { start, end };
}

function graphqlAuthenticationToken(uid: string): string {
  return jwt.sign({ userId: uid }, env["SESSION_SECRET"] as string, { expiresIn: "15 minutes" });
}

function linkTo(gig, baseUrl: string): string {
  return `${baseUrl}/members/gigs/${gig.id}`;
}

function authFor({ type, gig, uid }: { type: string; gig?: number; uid: number }): string {
  return crypto
    .createHash("md5")
    .update(Buffer.from(`${CALENDAR_SECRET}${uid}type=${type}${gig ? `&gig=${gig}` : ""}`))
    .digest("hex");
}

function testAuthLink(query: URLSearchParams) {
  try {
    const type = query.get("type");
    const gig = parseInt(query.get("gig"));
    const uid = parseInt(query.get("_cal_uid"));
    const a = query.get("_cal_auth");

    const auth = authFor({ type, gig, uid });

    return auth == a;
  } catch (e) {
    // TODO better error
    console.error(e);
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

  addGig(gig) {
    const { start, end } = startEndTimes(gig);
    let description = `[Correct as of ${DateTime.local().toHTTP()}.]`;
    const times = [`| Time: ${DateTime.fromISO(gig.time).toLocaleString(DateTime.TIME_24_SIMPLE) || ""}`.trim()];
    if (gig.arrive_time) {
      times.push(`Arrive ${DateTime.fromISO(gig.arrive_time).toLocaleString(DateTime.TIME_24_SIMPLE)}`);
    }
    if (gig.finish_time) {
      times.push(`Finish ${DateTime.fromISO(gig.finish_time).toLocaleString(DateTime.TIME_24_SIMPLE)}`);
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

export async function allGigs(client: GraphQLClient, uid: number, ipAddress: string, baseUrl: string) {
  let [resUserGigs, hidden] = [undefined, undefined];
  try {
    const twoDaysAgo = DateTime.local().minus({ days: 2 }).toISO();
    const variables = { user_id: uid, startDate: twoDaysAgo, startTime: twoDaysAgo };
    [resUserGigs, hidden] = await Promise.all([
      firstSuccess([
        client.query({ query: AdminAllGigsFrom, variables }),
        client.query({ query: AllGigsFrom, variables }),
      ]),
      client
        .query({ query: gigAdminGuard })
        .then((_) => true)
        .catch((_) => false),
    ]);
  } catch (e) {
    console.trace(e);
    throw handleErrors(e);
  }
  const em = orm.em.fork();
  const update = em.upsert(CalendarSubscription, {
    calendarType: "allgigs" as unknown as CalendarSubscriptionType,
    ipAddress,
    user: uid.toString(),
    lastAccessed: "now()" as unknown as Date,
  });
  const user = resUserGigs.data.cucb_users_by_pk;
  const fullName = `${user.first} ${user.last}`;

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
  for (let gig of resUserGigs.data.cucb_gigs) {
    calendar.addGig(gig);
  }
  try {
    await update;
  } catch (e) {
    console.trace(e);
    // TODO this should probably be handled differently
    // should it even be an error?
    // it should probably notify the webmaster?
    throw handleErrors(e);
  }
  return calendar.generate();
}

export async function myGigs(client: GraphQLClient, uid: number, ipAddress: string, baseUrl: string) {
  let [resUserGigs, hidden] = [undefined, undefined];
  try {
    const twoDaysAgo = DateTime.local().minus({ days: 2 }).toISO();
    const variables = { user_id: uid, startDate: twoDaysAgo, startTime: twoDaysAgo };
    [resUserGigs, hidden] = await Promise.all([
      firstSuccess([
        client.query({ query: AdminMyGigsFrom, variables }),
        client.query({ query: MyGigsFrom, variables }),
      ]),
      client
        .query({ query: gigAdminGuard })
        .then((_) => true)
        .catch((_) => false),
    ]);
  } catch (e) {
    console.trace(e);
    throw handleErrors(e);
  }
  const em = orm.em.fork();
  const update = em.upsert(CalendarSubscription, {
    calendarType: "mygigs" as unknown as CalendarSubscriptionType,
    ipAddress,
    user: uid.toString(),
    lastAccessed: "now()" as unknown as Date,
  });
  const user = resUserGigs.data.cucb_users_by_pk;
  const fullName = `${user.first} ${user.last}`;

  const calendar = new GigCalendar(
    `CUCB: ${fullName}'s Gig Feed`,
    `Auto-generated CUCB gig feed, generated for the\
    ${hidden ? " privileged" : ""} user ${fullName} of all upcoming (and very recent) \
    CUCB gigs they're performing in. Notice that depending on how you use this calendar, \
    it might not sync, sync maybe daily [Google URL feed], or sync more frequently. \
    [This description retrieved ${DateTime.local().toHTTP()}.]`,
    baseUrl,
  );
  for (let gig of user.gig_lineups.map((g) => g.gig)) {
    calendar.addGig(gig);
  }
  try {
    await update;
  } catch (e) {
    console.trace(e);
    // TODO same as above
    throw handleErrors(e);
  }
  return calendar.generate();
}

export async function singleGig(client: GraphQLClient, gig_id: number, baseUrl: string) {
  let resGig;
  try {
    let variables = { id: gig_id };
    resGig = await firstSuccess([
      client.query({ query: AdminSingleGig, variables }),
      client.query({ query: SingleGig, variables }),
    ]);
  } catch (e) {
    console.trace(e);
    throw handleErrors(e);
  }
  const gig = resGig.data.cucb_gigs_by_pk;

  const calendar = new GigCalendar(
    `Gig: ${gig.title} [${gig_id}]`,
    `Auto-generated information for gig ID ${gig_id}`,
    baseUrl,
  );

  calendar.addGig(gig);
  return calendar.generate();
}

export function calendarUrl(params: URLSearchParams): string {
  return `/data/cal.php?${params.toString()}`;
}

export function gigCalendarUrl(id: number, user_id: number): string {
  const params = new URLSearchParams({
    type: "gig",
    gig: id.toString(),
    _cal_uid: user_id.toString(),
    _cal_auth: authFor({ type: "gig", gig: id, uid: user_id }),
  });
  return calendarUrl(params);
}

export function allgigsCalendarUrl(user_id: number): string {
  const params = new URLSearchParams({
    type: "allgigs",
    _cal_uid: user_id.toString(),
    _cal_auth: authFor({ type: "allgigs", uid: user_id }),
  });
  return calendarUrl(params);
}

export function mygigsCalendarUrl(user_id: number): string {
  const params = new URLSearchParams({
    type: "mygigs",
    _cal_uid: user_id.toString(),
    _cal_auth: authFor({ type: "mygigs", uid: user_id }),
  });
  return calendarUrl(params);
}

export async function GET({ url, request }: { url: URL; request: Request }) {
  let client = undefined;
  const { host, "x-forwarded-proto": proto, "x-forwarded-for": ipAddress } = Object.fromEntries(request.headers);
  const baseUrl = `${proto}://${host}`;
  if (testAuthLink(url.searchParams)) {
    client = new GraphQLClient(fetch, {
      domain: env["GRAPHQL_REMOTE"],
      headers: { authorization: `Bearer ${graphqlAuthenticationToken(url.searchParams.get("_cal_uid"))}` },
    });
  } else {
    throw error(401, "Incorrect token");
  }

  let body, filename;
  try {
    switch (url.searchParams.get("type")) {
      case "gig":
        // TODO this will likely just give a 500 if we can't parse an integer
        body = await singleGig(client, parseInt(url.searchParams.get("gig")), baseUrl);
        filename = `gig${url.searchParams.get("gig")}.ics`;
        break;
      case "allgigs":
        body = await allGigs(client, parseInt(url.searchParams.get("_cal_uid")), ipAddress, baseUrl);
        filename = `allgigs.ics`;
        break;
      case "mygigs":
        body = await myGigs(client, parseInt(url.searchParams.get("_cal_uid")), ipAddress, baseUrl);
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
      filename: "allgigs.ics",
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
