import type { SapperRequest, SapperResponse } from "@sapper/server";
import { Record, String } from "runtypes";
import { completePasswordReset } from "../../../auth";

type PostRequest = SapperRequest & { body: { password?: unknown; token?: unknown } };

const Body = Record({
  password: String.withConstraint((value) => value.length >= 6),
  token: String,
});

export async function post(request: PostRequest, response: SapperResponse, _next: unknown): Promise<void> {
  if (Body.guard(request.body)) {
    try {
      await completePasswordReset(request.body);
      response.statusCode = 200;
      response.end("");
    } catch (e) {
      response.statusCode = e.status;
      response.end(e.message);
    }
  } else if ("password" in request.body && String.check(request.body["password"])) {
    response.statusCode = 400;
    response.end("Password is too short");
  } else {
    response.statusCode = 400;
    response.end("Missing field password in body");
  }
}
