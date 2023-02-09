import { error, json } from "@sveltejs/kit";
import orm from "$lib/database";
import { GigVenue } from "$lib/entities/GigVenue";
import { UPDATE_GIG_DETAILS } from "$lib/permissions";
import type { RequestEvent } from "./$types";
import { nullToUndefined, VALID_VENUE, filterFields } from "../+server";

export const POST = async ({ locals: { session }, request, params: { venue_id } }: RequestEvent): Promise<Response> => {
  if (UPDATE_GIG_DETAILS.guard(session)) {
    const body = nullToUndefined(await request.json());

    if (VALID_VENUE.guard(body)) {
      const filteredBody = filterFields(VALID_VENUE, body);
      const venues = (await orm()).em.fork().getRepository(GigVenue);

      await venues.nativeUpdate({ id: venue_id }, filteredBody);
      const venue = await venues.findOne(filteredBody);
      return json(venue);
    } else {
      throw error(400, "Invalid body");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};

export const DELETE = async ({
  locals: { session },
  request,
  params: { venue_id },
}: RequestEvent): Promise<Response> => {
  if (UPDATE_GIG_DETAILS.guard(session)) {
    const em = (await orm()).em.fork();
    const venue = await em.findOne(GigVenue, { id: venue_id });
    if (venue) {
      await em.removeAndFlush(venue);
      return new Response();
    } else {
      throw error(404, "Venue not found");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
