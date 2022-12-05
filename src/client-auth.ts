import { error } from "@sveltejs/kit";

export function assertLoggedIn<T extends { userId: string }>(session: {} | T): T {
  if ("userId" in session) {
    return session;
  } else {
    throw error(401, "Not logged in");
  }
}
