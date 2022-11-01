import { get } from "svelte/store";
import { assertLoggedIn } from "../../client-auth";
import { client, clientCurrentUser, GraphQLClient } from "../../graphql/client";
import { QueryPrefsLike } from "../../graphql/prefs";
import { prefs } from "../../state";

export async function load({ fetch, parent }) {
  const { session } = await parent();
  assertLoggedIn(session);
  client.set(new GraphQLClient(fetch));
  clientCurrentUser.set(new GraphQLClient(fetch, { role: "current_user" }));

  let res = await get(clientCurrentUser).query({
    query: QueryPrefsLike,
    variables: { name: "%" },
  });

  if (!res.data) {
    // Don't properly fail, we can live without the information, but show an error
    console.error(res);
  } else {
    let prefs_ = {};
    for (let pref of res.data.cucb_users?.[0].prefs || []) {
      prefs_[pref.pref_type.name] = pref.value;
    }

    prefs.set(prefs_);
  }
}
