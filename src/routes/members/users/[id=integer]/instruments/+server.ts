import { assertLoggedIn } from "../../../../../client-auth";
import { UPDATE_INSTRUMENTS } from "$lib/permissions";
import type { RequestEvent } from "./$types";
import orm from "$lib/database";
import { UserInstrument } from "$lib/entities/UsersInstrument";
import { error, json } from "@sveltejs/kit";
import { Literal, Null, Record, String } from "runtypes";

export const DELETE = async ({ request, params: { id }, locals: { session } }: RequestEvent): Promise<Response> => {
  assertLoggedIn(session);
  if (UPDATE_INSTRUMENTS(id).guard(session)) {
    const { userInstrumentId } = await request.json();
    const em = orm.em.fork();
    const instrumentGigs = await em.findOne(
      UserInstrument,
      {
        lineup_entries: { $exists: true },
        id: userInstrumentId,
      },
      { populate: ["instrument"] },
    );
    if (instrumentGigs) {
      // If the user has ever signed up for a gig with the instrument, just mark it as deleted
      instrumentGigs.deleted = true;
      await em.persistAndFlush(instrumentGigs);
      return json(instrumentGigs);
    } else {
      // ...otherwise we can delete the instrument entirely
      await em.nativeDelete(UserInstrument, { id: userInstrumentId });
      return json(null);
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};

const RESTORE_DELETED = Record({ deleted: Literal(false), userInstrumentId: String });
const CREATE = Record({ nickname: String.Or(Null), instrument_id: String });
const UPDATE_NICKNAME = Record({ nickname: String.Or(Null), userInstrumentId: String });

export const POST = async ({
  request,
  locals: { session },
  params: { id: userId },
}: RequestEvent): Promise<Response> => {
  assertLoggedIn(session);

  if (UPDATE_INSTRUMENTS(userId).guard(session)) {
    const em = orm.em.fork();
    let body = await request.json();
    if (RESTORE_DELETED.guard(body)) {
      const id = body.userInstrumentId;
      const userInstrument = await em.findOne(UserInstrument, { id }, { populate: ["instrument"] });
      if (userInstrument) {
        userInstrument.deleted = false;
        await em.persistAndFlush(userInstrument);
        return json(userInstrument);
      } else {
        throw error(400, "Unrecognised user instrument");
      }
    } else if (UPDATE_NICKNAME.guard(body)) {
      const id = body.userInstrumentId;
      const userInstrument = await em.findOne(UserInstrument, { id }, { populate: ["instrument"] });
      if (userInstrument) {
        userInstrument.nickname = body.nickname || undefined;
        await em.persistAndFlush(userInstrument);
        return json(userInstrument);
      } else {
        throw error(400, "Unrecognised user instrument");
      }
    } else if (CREATE.guard(body)) {
      const newUserInstrument = em.create(UserInstrument, {
        instrument: body.instrument_id,
        nickname: body.nickname || undefined,
        user: userId,
      });
      await em.persistAndFlush(newUserInstrument);
      const userInstrument = await em.findOne(
        UserInstrument,
        { id: newUserInstrument.id },
        { populate: ["instrument"] },
      );
      return json(userInstrument);
    } else {
      throw error(400, "Unrecognized change");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
