import ApolloClient from "apollo-client";
import { createHttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { setContext } from "apollo-link-context";
import { writable } from "svelte/store";

const host = process.env.GRAPHQL_REMOTE;
const path = process.env.GRAPHQL_PATH;

export const client = writable(null);
export const clientCurrentUser = writable(null);

export function makeClient(fetch, kwargs) {
  const browserDomain =
    typeof window !== "undefined"
      ? window.location.href
          .split("/", 3)
          .slice(0, 3)
          .join("/")
      : undefined;

  const httpLink = createHttpLink({
    uri: `${browserDomain || host}${path}`,
    fetch,
  });

  const role = kwargs && kwargs.role;

  const authLink = setContext((_, { headers }) => {
    // return the headers to the context so httpLink can read them
    headers = role ? { ...headers, "X-Hasura-Role": role } : headers;
    return {
      headers,
      credentials: "include",
    };
  });

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
}

export function handleErrors(e, session) {
  if (!e) {
    return;
  } else if (e.graphQLErrors && e.graphQLErrors[0]) {
    const code = e.graphQLErrors[0].extensions.code;
    if (code === "validation-failed") {
      if (session && session.hasuraRole) {
        this.error(403, "You're not supposed to be here!");
      } else {
        this.error(401, "Not logged in");
      }
    } else if (code === "access-denied") {
      this.error(403, "You're not supposed to be here!");
    } else {
      this.error(
        500,
        `Something went wrong, "${code}" apparently. Let the webmaster know and they'll try and help you`,
      );
    }
  } else {
    this.error(
      500,
      `Something went wrong, "${e}" apparently. Let the webmaster know and they'll try and help you`,
    );
  }
}
