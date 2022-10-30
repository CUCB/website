import jwt from "jsonwebtoken";
import { Number, Record, String } from "runtypes";
import dotenv from "dotenv";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

dotenv.config();

const PasswordResetToken = Record({
  id: Number,
  email: String,
});

export const GET: RequestHandler = async ({ params }) => {
  try {
    const token = jwt.verify(params["token"], process.env["SESSION_SECRET"] as string);
    if (PasswordResetToken.guard(token)) {
      return json(token);
    } else {
      throw error(400, "Token contents invalid");
    }
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      throw error(410, "Expired token");
    } else {
      throw error(400, "Token is not a valid JWT");
    }
  }
};
