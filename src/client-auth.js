export function notLoggedIn(session) {
  if (!session.userId) {
    this.error(401, "Not logged in");
    return true;
  } else {
    return false;
  }
}
