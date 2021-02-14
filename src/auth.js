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

let _cachedPool;
export let pool = () => {
  return (_cachedPool =
    _cachedPool ||
    new Pool({
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: process.env.PG_PORT,
      max: 5,
    }));
};

const errors = {
  INCORRECT_USERNAME_OR_PASSWORD: {
    message: "Incorrect username or password",
    status: 401,
  },
  INTERNAL_ERROR: {
    message: "Something went wrong. Probably best to let the webmaster know",
    status: 500,
  },
};

export const login = async ({ username, password }) => {
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
        throw new Error(errors.INCORRECT_USERNAME_OR_PASSWORD);
      }
    } else if (res.data.cucb_users.length === 0) {
      throw new Error(errors.INCORRECT_USERNAME_OR_PASSWORD);
    } else {
      throw new Error(errors.INTERNAL_ERROR);
    }
  } else {
    throw new Error(errors.INTERNAL_ERROR);
  }
};

export const createAccount = async ({ username, password, email, firstName, lastName }) => {
  let client = makeGraphqlClient();
  let emailSearch = await client.query({
    query: gql`
      query SearchList042($email: String!) {
        cucb_list042(where: { email: { _eq: $email } }) {
          email
        }
      }
    `,
    variables: { email },
  });
  if (emailSearch && emailSearch.data && emailSearch.data.cucb_list042.length > 0) {
    const SALT_ROUNDS = 10;
    let saltedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    // Discard password before we accidentally do anything stupid
    password = null;
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
      throw new Error(errors.INTERNAL_ERROR);
    }
  } else {
    throw new Error(errors.NOT_ON_MAILING_LIST);
  }
};
