import type { RequestHandler } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import { Record, String } from "runtypes";
import { completePasswordReset } from "../../../../auth";

const Body = Record({
  password: String.withConstraint((value) => value.length >= 6),
  token: String,
});

export const POST: RequestHandler = async ({ request }) => {
  const body = Object.fromEntries(await request.formData());

  if (Body.guard(body)) {
    try {
      await completePasswordReset(body);
      return new Response("", { status: 200 });
    } catch (e) {
      if (e.status) {
        throw error(e.status, e.message);
      } else {
        throw e;
      }
    }
  } else if ("password" in body && String.check(body["password"])) {
    throw error(400, "Password is too short");
  } else {
    throw error(400, "Missing field password in body");
  }
};
