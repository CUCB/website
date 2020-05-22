import gql from "graphql-tag";

export const AttributePreferences = gql`
  fragment AttributePreferences on cucb_users {
    prefs(where: { pref_type: { name: { _ilike: "attribute.%" } } }) {
      pref_type {
        id
        name
      }
      value
    }
  }
`;

export const extractAttributes = query_data =>
  query_data.prefs
    .filter(pref => pref.value)
    .map(pref => pref.pref_type.name.slice("attribute.".length));
