import jwt from "jsonwebtoken";
import type { SapperRequest, SapperResponse } from "@sapper/server";
import { Number, Record, String } from "runtypes";

const PasswordResetToken = Record({
  id: Number,
  email: String,
});

export async function get(req: SapperRequest, res: SapperResponse, _: never) {
  try {
    const token = jwt.verify(req.params["token"], process.env.SESSION_SECRET as string);
    if (PasswordResetToken.guard(token)) {
      res.statusCode = 200;
      res.end(JSON.stringify(token));
    } else {
      res.statusCode = 400;
      res.end("Token contents invalid")
    }
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      res.statusCode = 410;
      res.end("Expired token");
    } else {
      res.statusCode = 400;
      res.end("Token is not a valid JWT");
    }
  }
}
