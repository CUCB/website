import { redirect } from "@sveltejs/kit";

export const GET = async ({ locals, cookies }) => {
  if (locals.session) {
    const cookie = await locals.session.destroy();
    cookies.delete(...cookie);
  }
  throw redirect(302, "/");
};

export function POST(event) {
  return GET(event);
}
