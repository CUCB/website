import { error, fail } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../client-auth";
import { List042 } from "$lib/entities/List042";
import orm from "$lib/database";
import { UPDATE_LIST042 } from "$lib/permissions";
import type { Actions, PageServerLoad } from "./$types";
import { QueryOrder } from "@mikro-orm/core";
import { Record, String } from "runtypes";
import { CRSID_PATTERN, EMAIL_PATTERN } from "../../auth/_register";

const newEmail = Record({ email: String.withConstraint((s) => s.match(CRSID_PATTERN) || s.match(EMAIL_PATTERN)) });

export const actions: Actions = {
  default: async (event) => {
    const body = Object.fromEntries(await event.request.formData());
    if (newEmail.guard(body)) {
      if (!body.email.includes("@")) body.email += "@cam.ac.uk";
      const em = (await orm()).em.fork();
      const email = em.create(List042, body);
      try {
        await em.persistAndFlush(email);
        return { ...email, success: true };
      } catch (e) {
        // TODO check this is actually a uniqueness constraint violation
        return fail(409, { ...email, alreadyAdded: true });
      }
    } else {
      return fail(400, { missing: true });
    }
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
