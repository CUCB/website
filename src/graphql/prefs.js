import gql from "graphql-tag";

export const QueryPrefsLike = gql`
  query QueryPrefsLike($name: String!) {
    cucb_users {
      prefs(where: { pref_type: { name: { _ilike: $name } } }) {
        value
        pref_type {
          name
        }
      }
    }
  }
`;
