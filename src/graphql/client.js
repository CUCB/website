import ApolloClient from "apollo-client";
import { createHttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";

export function makeClient(fetch) {
    const link = createHttpLink({
        uri: `http://sapper.cucb.co.uk:8080/v1/graphql`,
        fetch
    });
    console.log("graphql")
    return new ApolloClient({ link, cache: new InMemoryCache() });
}
