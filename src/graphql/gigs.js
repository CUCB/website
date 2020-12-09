import gql from "graphql-tag";

const FragmentGigDetails = gql`
  fragment GigDetails on cucb_gigs {
    type: gig_type {
      code
      title
    }
    date
    sort_date
    title
    id
    venue {
      id
      map_link
      name
      subvenue
    }
    finish_time
    arrive_time
    allow_signups
    time
    contacts {
      calling
      id: contact_id
      contact {
        name
      }
    }
    gig_type {
      code
      title
    }
    summary
    notes_band
    advertise
    food_provided
    lineup(where: { approved: { _eq: true } }, order_by: { leader: desc, equipment: asc }) {
      user {
        id
        first
        last
      }
      leader
      money_collector
      driver
      equipment
      user_instruments(where: { approved: { _eq: true } }) {
        user_instrument_id
        user_instrument {
          nickname
          instrument {
            id
            name
          }
        }
      }
    }
  }
`;

const FragmentGigAdminDetails = gql`
  fragment GigAdminDetails on cucb_gigs {
    notes_admin
    contacts {
      client
      contact {
        organization
      }
    }
    admins_only
  }
`;

const FragmentGigFinancials = gql`
  fragment GigFinancials on cucb_gigs {
    finance
    finance_deposit_received
    finance_payment_received
    finance_caller_paid
  }
`;

export const QueryGigDetails = role => {
  if (["webmaster", "president", "secretary", "treasurer"].includes(role)) {
    return gql`
      query QueryGigDetails($gig_id: bigint!) {
        cucb_gigs_by_pk(id: $gig_id) {
          ...GigDetails
          ...GigAdminDetails
          ...GigFinancials
        }
      }
      ${FragmentGigDetails}
      ${FragmentGigAdminDetails}
      ${FragmentGigFinancials}
    `;
  } else {
    return gql`
      query QueryGigDetails($gig_id: bigint!) {
        cucb_gigs_by_pk(id: $gig_id) {
          ...GigDetails
        }
      }
      ${FragmentGigDetails}
    `;
  }
};

const FragmentGigEditDetails = gql`
  fragment GigEditDetails on cucb_gigs {
    posting_time
    posting_user: posting_user_obj {
      id
      first
      last
    }
    editing_time
    editing_user: editing_user_obj {
      id
      first
      last
    }
  }
`;

export const QueryEditGigDetails = gql`
  query QueryEditGigDetails($gig_id: bigint!) {
    cucb_gigs_by_pk(id: $gig_id) {
      ...GigDetails
      ...GigAdminDetails
      ...GigEditDetails
      type_id: type
      venue_id
      venue {
        id
        name
        subvenue
        map_link
        distance_miles
        notes_admin
        notes_band
        address
        postcode
        latitude
        longitude
      }
    }
  }
  ${FragmentGigDetails}
  ${FragmentGigAdminDetails}
  ${FragmentGigEditDetails}
`;

export const QueryMultiGigDetails = role => {
  if (["webmaster", "president", "secretary", "treasurer"].includes(role)) {
    return gql`
      query QueryGigDetails($where: cucb_gigs_bool_exp, $limit: Int, $offset: Int, $order_by: [cucb_gigs_order_by!]) {
        cucb_gigs(where: $where, limit: $limit, offset: $offset, order_by: $order_by) {
          ...GigDetails
          ...GigAdminDetails
          ...GigFinancials
        }
      }
      ${FragmentGigDetails}
      ${FragmentGigAdminDetails}
      ${FragmentGigFinancials}
    `;
  } else {
    return gql`
      query QueryGigDetails($where: cucb_gigs_bool_exp, $limit: Int, $offset: Int, $order_by: [cucb_gigs_order_by!]) {
        cucb_gigs(where: $where, limit: $limit, offset: $offset, order_by: $order_by) {
          ...GigDetails
        }
      }
      ${FragmentGigDetails}
    `;
  }
};

export const QueryGigSignup = gql`
  query QueryGigSignup {
    cucb_gigs(where: { admins_only: { _eq: false }, allow_signups: { _eq: true } }, order_by: { date: asc }) {
      date
      title
      lineup {
        user_available
        user_only_if_necessary
        user_notes
        user_id
        user_instruments {
          user_instrument_id
          approved
        }
        id
        user {
          gig_notes
        }
      }
      id
      venue {
        id
        map_link
        name
        subvenue
      }
      finish_time
      arrive_time
      time
    }
    cucb_users_instruments(where: { deleted: { _neq: true } }) {
      nickname
      instrument {
        id
        name
        novelty
      }
      user_id
      id
      instr_id
    }
  }
`;

export const QuerySingleGig = gql`
  query QuerySingleGig($gig_id: bigint) {
    cucb_gigs(where: { admins_only: { _eq: false }, allow_signups: { _eq: true }, id: { _eq: $gig_id } }) {
      date
      title
      allow_signups
      lineup {
        user_available
        user_only_if_necessary
        user_notes
        user_id
        user_instruments {
          user_instrument_id
          approved
        }
        id
        user {
          gig_notes
        }
      }
      id
      venue {
        id
        map_link
        name
        subvenue
      }
      finish_time
      arrive_time
      time
    }
    cucb_users_instruments(where: { deleted: { _neq: true } }) {
      nickname
      instrument {
        id
        name
        novelty
      }
      user_id
      id
      instr_id
    }
  }
`;

export const QueryMultiGigSignup = gql`
  query QueryMultiGigSignup($where: cucb_gigs_bool_exp) {
    cucb_gigs(where: $where) {
      date
      title
      lineup {
        user_available
        user_only_if_necessary
        user_notes
        user_id
        user_instruments {
          user_instrument_id
          approved
        }
        id
        user {
          gig_notes
        }
      }
      id
      venue {
        id
        map_link
        name
        subvenue
      }
      finish_time
      arrive_time
      time
    }
    cucb_users_instruments(where: { deleted: { _neq: true } }) {
      nickname
      instrument {
        id
        name
        novelty
      }
      user_id
      id
      instr_id
    }
  }
`;

export const UpdateSignupStatus = gql`
  mutation UpdateSignupStatus($gig_id: bigint!, $user_available: Boolean!, $user_only_if_necessary: Boolean!) {
    insert_cucb_gigs_lineups(
      on_conflict: { constraint: gigs_lineups_pkey, update_columns: [user_available, user_only_if_necessary] }
      objects: { user_available: $user_available, user_only_if_necessary: $user_only_if_necessary, gig_id: $gig_id }
    ) {
      returning {
        user_available
        user_only_if_necessary
        user {
          gig_notes
        }
      }
      affected_rows
    }
  }
`;

export const UpdateSignupInstruments = gql`
  mutation UpdateSignupInstruments(
    $to_remove: [bigint!]
    $gig_id: bigint!
    $to_add: [cucb_gigs_lineups_instruments_insert_input!]!
  ) {
    delete_cucb_gigs_lineups_instruments(
      where: { _and: { user_instrument_id: { _in: $to_remove }, gig_id: { _eq: $gig_id } } }
    ) {
      returning {
        user_instrument_id
      }
      affected_rows
    }
    insert_cucb_gigs_lineups_instruments(objects: $to_add) {
      affected_rows
      returning {
        user_instrument_id
      }
    }
  }
`;

export const UpdateSignupNotes = gql`
  mutation UpdateSignupNotes($gig_notes: String, $other_notes: String!, $gig_id: bigint) {
    update_cucb_gigs_lineups(where: { gig_id: { _eq: $gig_id } }, _set: { user_notes: $gig_notes }) {
      affected_rows
      returning {
        user_notes
      }
    }
    update_cucb_users(where: {}, _set: { gig_notes: $other_notes }) {
      affected_rows
      returning {
        gig_notes
      }
    }
  }
`;

export const QueryVenues = gql`
  query QueryVenues {
    cucb_gig_venues(order_by: { name: asc, subvenue: asc }) {
      id
      name
      subvenue
      map_link
      distance_miles
      notes_admin
      notes_band
      address
      postcode
      latitude
      longitude
    }
  }
`;

export const QueryGigTypes = gql`
  query QueryGigTypes {
    cucb_gig_types {
      id
      code
      title
    }
  }
`;

export const UpdateVenue = gql`
  mutation UpdateVenue(
    $id: bigint!
    $name: String!
    $subvenue: String
    $map_link: String
    $distance_miles: bigint
    $latitude: float8
    $longitude: float8
    $address: String
    $postcode: String
    $notes_admin: String
    $notes_band: String
  ) {
    update_cucb_gig_venues_by_pk(
      pk_columns: { id: $id }
      _set: {
        name: $name
        subvenue: $subvenue
        map_link: $map_link
        distance_miles: $distance_miles
        latitude: $latitude
        longitude: $longitude
        address: $address
        postcode: $postcode
        notes_admin: $notes_admin
        notes_band: $notes_band
      }
    ) {
      id
      name
      subvenue
      map_link
      distance_miles
      latitude
      longitude
      address
      postcode
      notes_admin
      notes_band
    }
  }
`;

export const CreateVenue = gql`
  mutation CreateVenue(
    $name: String!
    $subvenue: String
    $map_link: String
    $distance_miles: bigint
    $latitude: float8
    $longitude: float8
    $address: String
    $postcode: String
    $notes_admin: String
    $notes_band: String
  ) {
    insert_cucb_gig_venues_one(
      object: {
        name: $name
        subvenue: $subvenue
        map_link: $map_link
        distance_miles: $distance_miles
        latitude: $latitude
        longitude: $longitude
        address: $address
        postcode: $postcode
        notes_admin: $notes_admin
        notes_band: $notes_band
      }
    ) {
      id
      name
      subvenue
      map_link
      distance_miles
      latitude
      longitude
      address
      postcode
      notes_admin
      notes_band
    }
  }
`;
