import bcrypt from "bcrypt";
import crypto from "crypto";
import ApolloClient from "apollo-client";
import { HttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import gql from "graphql-tag";
import fetch from "node-fetch";
const SESSION_SECRET_HASH = crypto.createHash("sha512", process.env.SESSION_SECRET).digest("hex");

function makeGraphqlClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri: `${process.env.GRAPHQL_REMOTE}${process.env.GRAPHQL_PATH}`,
      headers: { "session-secret-hash": SESSION_SECRET_HASH, "x-hasura-role": "server" },
      fetch,
    }),
    cache: new InMemoryCache(),
  });
}

const errors = {
  INCORRECT_USERNAME_OR_PASSWORD: {
    message: "Incorrect username or password",
    status: 401,
  },
  INTERNAL_ERROR: {
    message: "Something went wrong. Probably best to let the webmaster know",
    status: 500,
  },
  NOT_ON_MAILING_LIST: {
    message:
      "The provided email/CRSid is not signed up to the mailing list. If you are signed up, let the webmaster know you've got this error and they should be able to help you out.",
    status: 404,
  },
  ACCOUNT_ALREADY_EXISTS: {
    message:
      `According to our records, an account with that email/CRSid already exists on the website. Perhaps you want to <a href="/auth/login" data-test=\"login\">login instead</a>?`,
    status: 409,
  },
};

export const login = async ({ username, password }) => {
  username = username.toLowerCase();
  let client = makeGraphqlClient();
  let res = await client.query({
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

  if (res && res.data) {
    if (res.data.cucb_users && res.data.cucb_users.length > 0) {
      let user = res.data.cucb_users[0];
      let hashedPassword = user.salted_password.replace("$2y$", "$2b$");
      let passwordCorrect = await bcrypt.compare(password, hashedPassword);

      if (passwordCorrect) {
        return user;
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

export const createAccount = async ({ username, password, email, firstName, lastName }) => {
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
  if (emailSearch && emailSearch.data && emailSearch.data.cucb_list042.length > 0) {
    username = username.toLowerCase();
    email = email.toLowerCase();
    const SALT_ROUNDS = 10;
    let saltedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    // Discard password before we accidentally do anything stupid
    password = null;
    try {
      let res = await client.mutate({
        mutation: gql`
          mutation(
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
      if (res && res.data && res.data.insert_cucb_users_one) {
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

function mysql_real_escape_string (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
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
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
            default:
                return char;
        }
    });
}