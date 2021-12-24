import bcrypt from "bcrypt";
import crypto from "crypto";
import { SMTPClient } from "emailjs";
import { makeClient } from "../src/graphql/client";
import gql from "graphql-tag";
import fetch from "node-fetch";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Static, Record, Number, String } from "runtypes";

dotenv.config();
if (typeof process.env["SESSION_SECRET"] === "undefined") {
  console.error("Error: SESSION_SECRET must be defined in .env before running the server");
  process.exit(1);
}
const SESSION_SECRET_HASH = crypto
  .createHash("sha512")
  .update(Buffer.from(process.env["SESSION_SECRET"] as string))
  .digest("hex");
const SALT_ROUNDS = 10;

export function makeGraphqlClient() {
  return makeClient(fetch, {
    domain: process.env["GRAPHQL_REMOTE"],
    role: "server",
    headers: { "session-secret-hash": SESSION_SECRET_HASH },
  });
}

const errors = {
  INCORRECT_USERNAME_OR_PASSWORD: {
    message: "Incorrect username or password",
    status: 401,
  },
  INTERNAL_ERROR: {
    message: "Something went wrong. Probably best to let the webmaster know.",
    status: 500,
  },
  NOT_ON_MAILING_LIST: {
    message:
      "The provided email/CRSid is not signed up to the mailing list. If you are signed up, let the webmaster know you've got this error and they should be able to help you out.",
    status: 404,
  },
  ACCOUNT_ALREADY_EXISTS: {
    message: `According to our records, an account with that email/CRSid already exists on the website. Perhaps you want to <a href="/auth/login" data-test=\"login\">login instead</a>?`,
    status: 409,
  },
  TOKEN_EXPIRED: {
    message: `The password reset token has expired. Please generate a new password reset link and try again.`,
    status: 401,
  },
  INVALID_TOKEN: {
    message: `The token provided is not valid.`,
    status: 400,
  },
};

interface LoginData {
  username: string;
  password: string;
}

type SessionData = {
  first: string;
  last: string;
  admin_type: {
    hasura_role: string;
  };
  user_id: number;
};

export const login: (details: LoginData) => Promise<SessionData> = async ({ username, password }) => {
  username = username.toLowerCase().trim();
  let client = makeGraphqlClient();
  let res;
  try {
    res = await client.query({
      query: gql`
        query SaltedPassword($username: String!) {
          cucb_users(where: { username: { _eq: $username } }) {
            salted_password
            first
            last
            admin_type {
              hasura_role
            }
            user_id: id
          }
        }
      `,
      variables: { username },
    });
  } catch (e) {
    console.error(e);
    throw { status: 500, message: e.message || "Internal server error" };
  }

  if (res && res.data) {
    if (res.data.cucb_users && res.data.cucb_users.length > 0) {
      let user = res.data.cucb_users[0];
      let hashedPassword = user.salted_password.replace("$2y$", "$2b$");
      let passwordCorrect = await bcrypt.compare(password, hashedPassword);

      if (passwordCorrect) {
        return { ...user, salted_password: undefined };
      } else {
        throw errors.INCORRECT_USERNAME_OR_PASSWORD;
      }
    } else if (res.data.cucb_users.length === 0) {
      throw errors.INCORRECT_USERNAME_OR_PASSWORD;
    } else {
      throw errors.INTERNAL_ERROR;
    }
  } else {
    throw errors.INTERNAL_ERROR;
  }
};

interface CreateAccountDetails {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}

type NewAccount = any;

export const createAccount: (details: CreateAccountDetails) => NewAccount = async ({
  username,
  password,
  email,
  firstName,
  lastName,
}) => {
  let client = makeGraphqlClient();
  let emailSearch = await client.query({
    query: gql`
      query SearchList042($email: String!) {
        cucb_list042(where: { email: { _ilike: $email } }) {
          email
        }
      }
    `,
    variables: { email: mysql_real_escape_string(email) },
  });
  if (emailSearch?.data?.cucb_list042.length > 0) {
    username = username.toLowerCase();
    email = email.toLowerCase();
    let saltedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    // Discard password before we accidentally do anything stupid
    password = "";
    try {
      let res = await client.mutate({
        mutation: gql`
          mutation (
            $username: String!
            $email: String!
            $saltedPassword: String!
            $firstName: String!
            $lastName: String!
          ) {
            insert_cucb_users_one(
              object: {
                username: $username
                salted_password: $saltedPassword
                first: $firstName
                last: $lastName
                email: $email
              }
            ) {
              first
              last
              admin_type {
                hasura_role
              }
              id
            }
          }
        `,
        variables: { username, email, saltedPassword, firstName, lastName },
      });
      if (res?.data?.insert_cucb_users_one) {
        return res.data.insert_cucb_users_one;
      } else {
        throw errors.INTERNAL_ERROR;
      }
    } catch (e) {
      if (e.message.match(/unique/i)) {
        throw errors.ACCOUNT_ALREADY_EXISTS;
      } else {
        throw errors.INTERNAL_ERROR;
      }
    }
  } else {
    throw errors.NOT_ON_MAILING_LIST;
  }
};

const PasswordResetToken = Record({
  id: Number,
  email: String,
});

export async function startPasswordReset({
  id,
  first,
  last,
  email,
}: {
  id: number;
  first: string;
  last: string;
  email: string;
}): Promise<void> {
  const payload: Static<typeof PasswordResetToken> = { id, email };
  const token = jwt.sign(payload, process.env["SESSION_SECRET"] as string, { expiresIn: "1 hour" });
  const emailClient = new SMTPClient({
    host: process.env["EMAIL_HOST"],
    ssl: process.env["EMAIL_SSL"] === "true",
    port: JSON.parse(process.env["EMAIL_PORT"] as string) as number,
    user: process.env["EMAIL_USERNAME"],
    password: process.env["EMAIL_PASSWORD"],
  });
  const link = `https://www.cucb.co.uk/auth/reset-password?token=${token}`;
  const text = `A password reset has been requested for your account. To choose a new password, go to ${link}. If you have any problems, please get in touch with the webmaster by replying to this email.`;
  const html = `A password reset has been requested for your account. To choose a new password, go to <a href="${link}">${link}</a>. If you have any problems, please get in touch with the webmaster by replying to this email.`;
  emailClient.send(
    {
      //@ts-ignore
      from: `CUCB Webmaster <${process.env["EMAIL_SEND_ADDRESS"]}>`,
      "reply-to": `CUCB Webmaster <${process.env["EMAIL_SEND_ADDRESS"]}>`,
      to: `${first} ${last} <${email}>`,
      subject: `CUCB — Password Reset`,
      content: `Hi ${first},

${text}

Thanks,
CUCB Webmaster\n`,
      attachment: [
        { data: `<html><p>Hi ${first},</p><p>${html}</p><p>Thanks,<br>CUCB Webmaster</p>`, alternative: true },
      ],
    },
    (err, msg) => {
      if (err != null) {
        console.error(`Error sending password reset email: ${err.message}`);
        throw errors.INTERNAL_ERROR;
      }
    },
  );
}

export async function completePasswordReset({ password, token }: { password: string; token: string }): Promise<void> {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env["SESSION_SECRET"] as string);
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      throw errors.TOKEN_EXPIRED;
    } else {
      throw errors.INVALID_TOKEN;
    }
  }

  if (PasswordResetToken.guard(decoded)) {
    const client = makeGraphqlClient();
    try {
      let saltedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      // Discard password before we accidentally do anything stupid
      password = "";
      await client.mutate({
        mutation: gql`
          mutation UpdateUserPassword($id: bigint!, $saltedPassword: String!) {
            update_cucb_users_by_pk(pk_columns: { id: $id }, _set: { salted_password: $saltedPassword }) {
              id
            }
          }
        `,
        variables: { id: decoded.id, saltedPassword },
      });
    } catch (e) {
      console.error(`GraphQL error trying to update user's password: ${e}`);
      throw errors.INTERNAL_ERROR;
    }
  }
}

// A Javascript port of a PHP function, copied from somewhere on the internet...
// Don't know where, but is useful to escape, % symbols so we can use ilike for a case insensitive match
function mysql_real_escape_string(str: string) {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char: string) {
    switch (char) {
      case "\0":
        return "\\0";
      case "\x08":
        return "\\b";
      case "\x09":
        return "\\t";
      case "\x1a":
        return "\\z";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case '"':
      case "'":
      case "\\":
      case "%":
        return "\\" + char; // prepends a backslash to backslash, percent,
      // and double/single quotes
      default:
        return char;
    }
  });
}
