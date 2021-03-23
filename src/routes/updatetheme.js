export async function post({ context: { session }, body }) {
  body = Object.fromEntries(body?.entries());
  session.theme = { ...body };
  await session.save(); // TODO handle errors
  return { status: 200, body: session };
}
