import { simpleParser } from "mailparser";
import dotenv from "dotenv";
dotenv.config();

export async function get({ query }) {
  try {
    const email = await fetch(`http://${process.env["EMAIL_HOST"]}:8025/api/v1/messages/${query.get("id")}/download`);
    const parsed = await simpleParser(await email.text());
    return {
      status: 200,
      headers: { "Content-Type": "text/html" },
      body: parsed.html || parsed.textAsHtml,
    };
  } catch (e) {
    return {
      status: 404,
      body: `Not found. Or some other error: ${e}`,
    };
  }
}
