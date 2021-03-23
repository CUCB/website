export async function get({ context }) {
  if (context.session) {
    const headers = await context.session.destroy();
    return { status: 302, headers: { ...headers, Location: "/" } };
  } else {
    return { status: 302, headers: { Location: "/" } };
  }
}

export function post({ context }) {
  return get({ context });
}
