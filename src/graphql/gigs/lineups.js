import { AttributePreferences } from "../../graphql/gigs/lineups/users/attributes";
import { LineupInstruments } from "../../graphql/gigs/lineups/users/instruments";
import { LineupRoles } from "../../graphql/gigs/lineups/users/roles";
import gql from "graphql-tag";

const LineupAvailability = gql`
  fragment LineupAvailability on cucb_gigs_lineups {
    user_available
    user_only_if_necessary
  }
`;

export const FragmentGigLineup = gql`
  fragment GigLineup on cucb_gigs {
    lineup {
      approved
      ...LineupRoles
      user {
        first
        last
        id
        ...AttributePreferences
      }
      ...LineupInstruments
      ...LineupAvailability
    }
  }
  ${AttributePreferences}
  ${LineupInstruments}
  ${LineupRoles}
  ${LineupAvailability}
`;

export const QueryGigLineup = gql`
  query QueryGigLineup($gig_id: bigint!) {
    cucb_gigs_by_pk(id: $gig_id) {
      ...GigLineup
    }
  }
  ${FragmentGigLineup}
`;
