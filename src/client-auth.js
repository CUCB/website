export function notLoggedIn(session) {
  if (!session.userId) {
    return { status: 401, error: "Not logged in" };
  }
}
