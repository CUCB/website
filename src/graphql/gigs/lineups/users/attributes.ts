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

export const AllPrefs = gql`
  query AllPrefs {
    cucb_user_pref_types {
      id
      name
      default
    }
  }
`;

interface ExtractAttributesInput {
  prefs: {
    pref_type: {
      name: string;
    };
    value: boolean;
  }[];
}

export const extractAttributes = (query_data: ExtractAttributesInput): string[] =>
  query_data.prefs.filter((pref) => pref.value).map((pref) => pref.pref_type.name.slice("attribute.".length));
