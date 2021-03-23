import type { Request, Response } from "@sveltejs/kit";
import { Record, String } from "runtypes";
import { CRSID_PATTERN, EMAIL_PATTERN } from "../_register";
import { makeGraphqlClient, startPasswordReset } from "../../../auth";
import gql from "graphql-tag";

type PostRequest = Request & { body: FormData };

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

export async function post(request: PostRequest): Promise<Response> {
  let body = Object.fromEntries(request.body.entries());
  if (Body.guard(body)) {
    let client = makeGraphqlClient();
    const userCheck = await client.query<UserEmail>({
      query: UserByUsername,
      variables: { username: body.username.toLowerCase() },
    });
    if (userCheck.data.cucb_users.length > 0) {
      try {
        await startPasswordReset(userCheck.data.cucb_users[0]);
        return { status: 204 };
      } catch (e) {
        return { status: e.status, body: e.message };
      }
    } else {
      return { status: 400, body: "Could not find email/CRSid" };
    }
  } else {
    return { status: 400, body: "It looks like what you submitted wasn't a valid CRSid/email address" };
  }
}
