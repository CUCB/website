import { DateTime } from "luxon";
import dotenv from "dotenv";
import { json } from "@sveltejs/kit";
import { Committee } from "$lib/entities/Committee";
import orm from "$lib/database";
import { QueryOrder } from "@mikro-orm/core";

dotenv.config();
let cached: object[] | undefined;
let retrieved: DateTime | undefined;

export async function GET() {
  // Return from cache if recent enough
  if (!retrieved || DateTime.local().diff(retrieved).hours > 0) {
    try {
      const committeeRepository = orm.em.fork().getRepository(Committee);
      const queryResult = await committeeRepository.findOne(
        { started: { $lte: "now()" } },
        {
          orderBy: { started: QueryOrder.DESC },
          fields: [{ members: ["name", "casualName", "emailObfus", "lookupName", { lookupName: ["name"] }] }],
          populate: ["members.lookupName"],
        },
      );

      cached = queryResult?.members.toArray();
    } catch (e) {
      console.trace(e);
      return json(
        {
          message: `Something went wrong. Let the webmaster know and they'll try and help you.`,
        },
        { status: 500 },
      );
    }
  }

  return json({ committee: cached, retrieved });
}
