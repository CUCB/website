import { redirect } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";

export const GET = async ({ locals, cookies }: RequestEvent): Promise<Response> => {
  if ("userId" in locals.session) {
    const cookie = await locals.session.destroy();
    if (cookie) {
      cookies.delete(...cookie);
    }
  }
  throw redirect(302, "/");
};

export function POST(event: RequestEvent): Promise<Response> {
  return GET(event);
}
