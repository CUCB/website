import gql from "graphql-tag";
import { AttributePreferences } from "./gigs/lineups/users/attributes";

export const fullDetails = gql`
  fragment FullUserDetails on cucb_users {
    id
    first
    last
    bio
    bio_changed_date
    last_login_date
    join_date
    mobile_contact_info
    location_info
    email
    dietaries
    ...AttributePreferences
    user_prefs {
      pref_id
    }
    gig_lineups(where: { approved: { _eq: true }, gig: { date: { _lt: "now()" } } }, order_by: { gig: { date: asc } }) {
      gig {
        id
        title
        date
        venue {
          name
          subvenue
        }
      }
      user_instruments(where: { approved: { _eq: true } }) {
        user_instrument {
          instrument {
            id
            name
            novelty
          }
        }
      }
    }
    user_instruments {
      instrument {
        id
        name
        novelty
      }
      id
      deleted
      nickname
    }
  }
  ${AttributePreferences}
`;

export const currentUser = gql`
  query CurrentUser($id: bigint!) {
    cucb_users_by_pk(id: $id) {
      ...FullUserDetails
    }
  }
  ${fullDetails}
`;

export const adminDetails = gql`
  query AdminDetails($id: bigint!) {
    cucb_users_by_pk(id: $id) {
      ...FullUserDetails
      admin_type {
        id
        title
      }
    }
  }
  ${fullDetails}
`;

export const otherUser = gql`
  query OtherUser($id: bigint!) {
    cucb_users_by_pk(id: $id) {
      id
      first
      last
      bio
      bio_changed_date
      last_login_date
      join_date
      gig_lineups(
        where: { approved: { _eq: true }, gig: { date: { _lt: "now()" } } }
        order_by: { gig: { date: asc } }
      ) {
        gig {
          id
          title
          date
          venue {
            name
            subvenue
          }
        }
        user_instruments(where: { approved: { _eq: true } }) {
          user_instrument {
            instrument {
              id
              name
              novelty
            }
          }
        }
      }
      user_instruments {
        instrument {
          id
          name
          novelty
        }
        id
        deleted
        nickname
      }
    }
  }
`;

// A guard to check if a user has permissions to update instruments
export const instrumentAdminGuard = gql`
  mutation InstrumentAdminGuard {
    update_cucb_users_instruments(where: { id: { _is_null: true } }) {
      affected_rows
    }
  }
`;

export const UpdateUserPrefs = gql`
  mutation UpdateUserPrefs($prefs: [cucb_user_prefs_insert_input!]!) {
    insert_cucb_user_prefs(
      objects: $prefs
      on_conflict: { constraint: cucb_user_prefs_user_id_pref_id_key, update_columns: value }
    ) {
      affected_rows
    }
  }
`;

export const UpdateUserDetails = gql`
  mutation UpdateUserDetails(
    $id: bigint!
    $email: String!
    $first: String!
    $last: String!
    $mobile_contact_info: String
    $dietaries: String
    $location_info: String
  ) {
    update_cucb_users_by_pk(
      pk_columns: { id: $id }
      _set: {
        email: $email
        first: $first
        last: $last
        mobile_contact_info: $mobile_contact_info
        dietaries: $dietaries
        location_info: $location_info
      }
    ) {
      id
      first
      last
      bio
      bio_changed_date
      last_login_date
      join_date
      mobile_contact_info
      location_info
      email
      dietaries
      ...AttributePreferences
    }
  }
  ${AttributePreferences}
`;
