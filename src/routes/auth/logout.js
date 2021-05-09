export async function get({ locals }) {
  if (locals.session) {
    const headers = await locals.session.destroy();
    return { status: 302, headers: { ...headers, Location: "/" } };
  } else {
    return { status: 302, headers: { Location: "/" } };
  }
}

export function post({ locals }) {
  return get({ locals });
}
