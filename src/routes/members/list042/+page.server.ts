import { error, fail } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../client-auth";
import { List042 } from "$lib/entities/List042";
import orm from "$lib/database";
import { UPDATE_LIST042 } from "$lib/permissions";
import type { Actions, PageServerLoad } from "./$types";
import { QueryOrder } from "@mikro-orm/core";
import { Record, String } from "runtypes";
import { CRSID_PATTERN, EMAIL_PATTERN } from "../../auth/_register";

const newEmail = Record({ email: String });

export const actions: Actions = {
  addSingle: async (event) => {
    const body = Object.fromEntries(await event.request.formData());
    if (newEmail.guard(body)) {
      if (body.email.match(CRSID_PATTERN)) {
        body.email += "@cam.ac.uk";
      } else if (!body.email.match(EMAIL_PATTERN)) {
        return fail(400, { ...body, error: "invalidEmailOrCrsid" as const, type: "single" as const });
      }
      body.email = body.email.toLowerCase();
      const em = (await orm()).em.fork();
      const email = em.create(List042, body);
      try {
        await em.persistAndFlush(email);
        return {
          success: true as const,
          added: [{ ...email }],
          type: "single" as const,
          email: null,
        };
      } catch (e) {
        // TODO check this is actually a uniqueness constraint violation
        return fail(409, { type: "single" as const, error: "alreadyAdded" as const });
      }
    } else {
      // TODO this should distinguish between invalid email and missing email
      return fail(400, { type: "single" as const, error: "missing" as const });
    }
  },
  merge: async (event) => {
    const body = await event.request.text();
    const emails = body
      .split("\n")
      .map((line) => line.trim())
      .map((email) => (email.match(CRSID_PATTERN) ? `${email}@cam.ac.uk` : email))
      .filter((email) => email.match(EMAIL_PATTERN))
      .map((email) => email.toLowerCase())
      .map((email) => ({ email }));
    const em = (await orm()).em.fork();
    const countBefore = await em.count(List042);
    await em.upsertMany(List042, emails);
    const countAfter = await em.count(List042);
    return {
      success: true as const,
      added: emails,
      numberFound: countAfter - countBefore,
      type: "file" as const,
    };
  },
};

export const load: PageServerLoad = async ({ locals }) => {
  const session = assertLoggedIn(locals.session);

  if (UPDATE_LIST042.guard(session)) {
    const emails = await (await orm()).em.fork().find(List042, {}, { orderBy: { email: QueryOrder.ASC } });
    return { emails: emails.map((email) => email.email) };
  } else {
    throw error(403, "You're not allowed here");
  }
};
