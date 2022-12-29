import orm from "$lib/database";
import { prefs } from "../../state";
import { User } from "$lib/entities/User";

export async function load({ parent }) {
  const { session } = await parent();

  try {
    const userRepository = (await orm()).em.fork().getRepository(User);
    const user = await userRepository.findOne(
      { id: session.userId },
      { populate: ["prefs", "prefs.pref_type"], fields: ["prefs.*"] },
    );
    const dbPrefs = user?.prefs?.toArray();

    let prefs_: Record<string, boolean> = {};
    // TODO test I work if no prefs are set
    for (let pref of dbPrefs || []) {
      prefs_[pref.pref_type.name] = pref.value;
    }

    // TODO do I actually work? The client.set stuff needed to be in layout.ts
    prefs.set(prefs_);
  } catch (e) {
    // Don't properly fail as it's not critical info
    console.trace(e);
  }
  return { session };
}
