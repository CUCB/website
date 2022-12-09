import { env } from "$env/dynamic/private";
import type { RequestHandler } from "@sveltejs/kit";

// TODO use env var
export const POST: RequestHandler = async ({ request, fetch }) => {
  return await fetch(`${env["GRAPHQL_REMOTE"]}/v1/graphql`, {
    ...request,
    method: "POST",
    body: await request.text(),
  });
};

export const GET: RequestHandler = async ({ request, fetch }) => {
  return await fetch(`${env["GRAPHQL_REMOTE"]}/v1/graphql`, {
    ...request,
    method: "GET",
    body: await request.text(),
  });
};
