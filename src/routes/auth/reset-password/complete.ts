import type { Request, Response } from "@sveltejs/kit";
import { Record, String } from "runtypes";
import { completePasswordReset } from "../../../auth";

type PostRequest = Request & { body: FormData };

const Body = Record({
  password: String.withConstraint((value) => value.length >= 6),
  token: String,
});

export async function post(request: PostRequest): Promise<Response> {
  const body = Object.fromEntries(request.body?.entries());
  if (Body.guard(body)) {
    try {
      await completePasswordReset(body);
      return { status: 204 };
    } catch (e) {
      return { status: e.status, body: e.message };
    }
  } else if ("password" in body && String.check(body["password"])) {
      return { status: 400, body: "Password is too short" };
  } else {
      return { status: 400, body: "Missing field password in body" };
  }
}
