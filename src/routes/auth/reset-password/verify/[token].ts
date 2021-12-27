import jwt from "jsonwebtoken";
import { Number, Record, String } from "runtypes";
import dotenv from "dotenv";
import type { Request, Response } from "@sveltejs/kit";

dotenv.config();

const PasswordResetToken = Record({
  id: Number,
  email: String,
});

export async function get({ params }: Request): Promise<Response> {
  try {
    const token = jwt.verify(params["token"], process.env["SESSION_SECRET"] as string);
    if (PasswordResetToken.guard(token)) {
      return { status: 200, body: token };
    } else {
      return { status: 400, body: "Token contents invalid" };
    }
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return { status: 410, body: "Expired token" };
    } else {
      return { status: 400, body: "Token is not a valid JWT" };
    }
  }
}
