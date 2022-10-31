import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
  return await fetch("http://graphql-engine:8080/v1/graphql", {
    ...request,
    method: "POST",
    body: await request.text(),
  });
};

export const GET: RequestHandler = async ({ request, fetch, cookies }) => {
  return await fetch("http://graphql-engine:8080/v1/graphql", {
    ...request,
    method: "GET",
    body: await request.text(),
  });
};
