import { error } from "@sveltejs/kit";

export function assertLoggedIn(session: { userId?: any }) {
  if (!session.userId) {
    throw error(401, "Not logged in");
  }
}
