import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
import type { DocumentNode } from "graphql/language/ast";
import { error } from "@sveltejs/kit";

const path = `/v1/graphql`;

export const client: Writable<GraphQLClient | null> = writable(null);
export const clientCurrentUser: Writable<GraphQLClient | null> = writable(null);

export type Fetch = (info: RequestInfo, init?: RequestInit) => Promise<Response>;
export class GraphQLClient {
  private fetch: Fetch;
  private role: string | undefined;
  private domain: string | undefined;
  private headers: Record<string, string> | undefined;

  constructor(fetch: Fetch, kwargs?: { role?: string; domain?: string; headers?: Record<string, string> }) {
    this.fetch = fetch;
    this.role = kwargs?.role;
    this.domain = kwargs?.domain;
    this.headers = kwargs?.headers || {};
  }

  // TODO type this better
  async query<T>(args: { query: DocumentNode | string; variables?: Record<string, any> }): Promise<{ data: T }> {
    let query,
      variables = undefined;
    typeof args === "object" ? ({ query, variables } = args) : (query = args);
    const browserDomain =
      typeof window !== "undefined" ? window.location.href.split("/", 3).slice(0, 3).join("/") : undefined;
    let headers = this.role ? { "X-Hasura-Role": this.role } : {};
    const that = typeof window !== "undefined" ? window : this;
    let res = await this.fetch.bind(that)(
      this.domain ? `${this.domain}${path}` : browserDomain ? `${browserDomain}${path}` : path,
      {
        method: "POST",
        headers: {
          ...headers,
          ...this.headers,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          query: typeof query === "string" ? query : query.loc.source.body,
          variables,
        }),
      },
    );
    let res2 = await res.json();
    if (res2?.errors?.length > 0) {
      throw { ...res2.errors[0], graphQLErrors: res2.errors };
    }
    return res2;
  }

  // TODO better types here too
  async mutate<T>(args: { mutation: DocumentNode | string; variables: Record<string, any> }): Promise<{ data: T }> {
    let mutation,
      variables = undefined;
    typeof args === "object" ? ({ mutation, variables } = args) : (mutation = args);
    const browserDomain =
      typeof window !== "undefined" ? window.location.href.split("/", 3).slice(0, 3).join("/") : undefined;
    let headers = this.role ? { "X-Hasura-Role": this.role } : {};
    const that = typeof window !== "undefined" ? window : this;
    let res = await this.fetch.bind(that)(
      this.domain ? `${this.domain}${path}` : browserDomain ? `${browserDomain}${path}` : path,
      {
        method: "POST",
        headers: {
          ...headers,
          ...this.headers,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          query: typeof mutation === "string" ? mutation : mutation.loc.source.body,
          variables,
        }),
        credentials: "include",
      },
    );
    let res2 = await res.json();
    if (res2?.errors?.length > 0) {
      throw { ...res2.errors[0], graphQLErrors: res2.errors };
    }
    return res2;
  }
}

export function handleErrors(
  e: { graphQLErrors?: { extensions: { code: string } }[] },
  session?: { hasuraRole?: string },
): never {
  if (e.graphQLErrors && e.graphQLErrors[0]) {
    const code = e.graphQLErrors[0].extensions.code;
    if (code === "validation-failed") {
      if (session && session.hasuraRole) {
        throw error(403, "You're not supposed to be here!");
      } else {
        throw error(401, "Not logged in");
      }
    } else if (code === "access-denied") {
      throw error(403, "You're not supposed to be here!");
    } else {
      console.error(e);
      throw error(
        500,
        `Something went wrong, "${code}" apparently. Let the webmaster know and they'll try and help you`,
      );
    }
  } else {
    console.error(e);
    throw error(500, `Something went wrong, "${e}" apparently. Let the webmaster know and they'll try and help you`);
  }
}
