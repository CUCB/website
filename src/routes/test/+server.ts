import orm from "../../lib/database";
import { Instrument } from "../../lib/entities/Instrument";

export async function GET() {
  const instruments = await orm.em.fork().find(Instrument, {}, { populate: [] });
  return new Response(
    instruments.map((i) => `em.create(Instrument, ${JSON.stringify({ ...i, parent: i.parent?.id })})`).join("\n"),
  );
}
