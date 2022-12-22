import { error, json } from "@sveltejs/kit";
import { Record, String, Undefined, Number } from "runtypes";
import type { RuntypeBase, Static } from "runtypes/lib/runtype";
import orm from "$lib/database";
import { GigVenue } from "$lib/entities/GigVenue";
import { UPDATE_GIG_DETAILS } from "$lib/permissions";
import type { RequestEvent } from "./$types";

export const VALID_VENUE = Record({
  name: String,
  subvenue: String.Or(Undefined),
  map_link: String.Or(Undefined),
  distance_miles: String.Or(Undefined),
  notes_admin: String.Or(Undefined),
  notes_band: String.Or(Undefined),
  address: String.Or(Undefined),
  postcode: String.Or(Undefined),
  latitude: Number.Or(Undefined),
  longitude: Number.Or(Undefined),
});

// Remove input values that are
export const nullToUndefined = (body: { [_: string]: unknown }): { [_: string]: unknown } =>
  Object.fromEntries(
    Object.entries(body)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, value ?? undefined]),
  );

export const filterFields = <T extends { [_: string]: RuntypeBase<unknown> }, R extends Record<T, false>>(
  guard: Record<T, false>,
  body: Static<R>,
): Static<R> =>
  guard.check(
    Object.fromEntries(
      Object.entries(body)
        .filter(([key, _]) => Object.keys(guard.fields).includes(key))
        .filter(([key, _]) => key != "userInstrumentId"),
    ),
  );

export const POST = async ({ locals: { session }, request }: RequestEvent): Promise<Response> => {
  if (UPDATE_GIG_DETAILS.guard(session)) {
    const body = nullToUndefined(await request.json());

    if (VALID_VENUE.guard(body)) {
      const filteredBody = filterFields(VALID_VENUE, body);
      const venues = (await orm()).em.fork().getRepository(GigVenue);
      const venue = venues.create(filteredBody);
      await venues.persistAndFlush(venue);
      return json(venue);
    } else {
      throw error(400, "Invalid body");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
