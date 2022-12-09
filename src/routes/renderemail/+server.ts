import { simpleParser } from "mailparser";
import dotenv from "dotenv";
import type { RequestHandler } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
dotenv.config();

export const GET: RequestHandler = async ({ url }) => {
  try {
    const email = await fetch(
      `http://${env["EMAIL_HOST"]}:8025/api/v1/messages/${url.searchParams.get("id")}/download`,
    );
    const parsed = await simpleParser(await email.text());
    return new Response(parsed.html || parsed.textAsHtml, { headers: { "Content-Type": "text/html" }, status: 200 });
  } catch (e) {
    throw error(404, `Not found. Or some other error: ${e}`);
  }
};
