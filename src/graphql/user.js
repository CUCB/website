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
            name
          }
        }
      }
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
              name
            }
          }
        }
      }
    }
  }
`;
