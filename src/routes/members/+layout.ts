import { assertLoggedIn } from "../../client-auth";
import { client, clientCurrentUser, GraphQLClient } from "../../graphql/client";

export async function load({ fetch, parent }) {
  const { session } = await parent();
  assertLoggedIn(session);
  client.set(new GraphQLClient(fetch));
  clientCurrentUser.set(new GraphQLClient(fetch, { role: "current_user" }));
}
