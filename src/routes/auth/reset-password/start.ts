import type { SapperRequest, SapperResponse } from "@sapper/server";
import { Record, String } from "runtypes";
import { CRSID_PATTERN, EMAIL_PATTERN } from "../_register";
import { makeGraphqlClient, startPasswordReset } from "../../../auth";
import gql from "graphql-tag";

type PostRequest = SapperRequest & { body: object };

const Body = Record({
  username: String.withConstraint(
    (value) => value.match(CRSID_PATTERN) !== null || value.match(EMAIL_PATTERN) !== null,
  ),
});

interface UserEmail {
  cucb_users: [
    {
      id: number;
      email: string;
      first: string;
      last: string;
    },
  ];
}

const UserByUsername = gql`
  query UserByUsername($username: String) {
    cucb_users(where: { _or: [{ username: { _eq: $username } }, { email: { _eq: $username } }] }) {
      id
      email
      first
      last
    }
  }
`;

export async function post(request: PostRequest, response: SapperResponse, _next: unknown): Promise<void> {
  if (Body.guard(request.body)) {
    let client = makeGraphqlClient();
    const userCheck = await client.query<UserEmail>({
      query: UserByUsername,
      variables: { username: request.body.username.toLowerCase() },
    });
    if (userCheck.data.cucb_users.length > 0) {
      try {
        await startPasswordReset(userCheck.data.cucb_users[0]);
        response.statusCode = 204;
        response.end();
      } catch (e) {
        response.statusCode = e.status;
        response.end(e.message);
      }
    } else {
      response.statusCode = 400;
      response.end("Could not find email/CRSid"); // TODO change this to return 200 too so people can't just discover accounts
    }
  } else {
    response.statusCode = 400;
    response.end("It looks like what you submitted wasn't a valid CRSid/email address.");
  }
}
