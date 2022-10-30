import type { RequestHandler } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import { Record, String } from "runtypes";
import { CRSID_PATTERN, EMAIL_PATTERN } from "../../_register";
import { makeGraphqlClient, startPasswordReset } from "../../../../auth";
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

export const POST: RequestHandler = async ({ request }) => {
  const body = Object.fromEntries(await request.formData());
  if (Body.guard(body)) {
    const client = makeGraphqlClient();
    const userCheck = await client.query<UserEmail>({
      query: UserByUsername,
      variables: { username: body.username.toLowerCase() },
    });
    if (userCheck.data.cucb_users.length > 0) {
      try {
        await startPasswordReset(userCheck.data.cucb_users[0]);
        return new Response("", { status: 204 });
      } catch (e) {
        throw error(e.status, e.message);
      }
    } else {
      throw error(400, "Could not find email/CRSid");
    }
  } else {
    throw error(400, "It looks like what you submitted wasn't a valid CRSid/email address");
  }
};
