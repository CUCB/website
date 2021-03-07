import type { SapperRequest, SapperResponse } from "@sapper/server";
import { Record, String } from "runtypes";
import { CRSID_PATTERN, EMAIL_PATTERN } from "./_register";

type PostRequest = SapperRequest & { body: object };

const PasswordResetBody = Record({
  username: String.withConstraint(
    (value) => value.match(CRSID_PATTERN) !== null || value.match(EMAIL_PATTERN) !== null,
  ),
  captchaKey: String,
});

export async function post(request: PostRequest, response: SapperResponse, _next: unknown): Promise<void> {
  if (PasswordResetBody.guard(request.body)) {
    const hcaptcha = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: `response=${request.body.captchaKey}&secret=${process.env.HCAPTCHA_SECRET}`,
    }).then((res) => res.json());
    if (hcaptcha.success) {
      response.statusCode = 200;
      response.end("");
    } else {
      response.statusCode = 400;
      response.end("Captcha verification failed. Did you tick the box?");
    }
  } else {
    response.statusCode = 400;
    response.end("It looks like what you submitted wasn't a valid CRSid/email address.");
  }
}
