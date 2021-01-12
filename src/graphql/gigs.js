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
    quote_date
  }
`;

export const QueryGigDetails = (role) => {
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
      ...GigFinancials
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
      contacts {
        contact {
          email
          notes
          caller
          id
        }
      }
    }
  }
  ${FragmentGigDetails}
  ${FragmentGigAdminDetails}
  ${FragmentGigEditDetails}
  ${FragmentGigFinancials}
`;

export const QueryMultiGigDetails = (role) => {
  if (["webmaster", "president", "secretary"].includes(role)) {
    return gql`
      query QueryGigDetails($where: cucb_gigs_bool_exp, $limit: Int, $offset: Int, $order_by: [cucb_gigs_order_by!]) {
        cucb_gigs(where: $where, limit: $limit, offset: $offset, order_by: $order_by) {
          ...GigDetails
          ...GigAdminDetails
          ...GigFinancials
          signupSummary: lineup {
            user {
              first
              last
            }
            user_available
            user_only_if_necessary
          }
        }
      }
      ${FragmentGigDetails}
      ${FragmentGigAdminDetails}
      ${FragmentGigFinancials}
    `;
  } else if (["treasurer"].includes(role)) {
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

export const UpdateGig = gql`
  mutation UpdateGig(
    $id: bigint!
    $title: String
    $date: date
    $time: time
    $type_id: bigint
    $admins_only: Boolean
    $advertise: Boolean
    $allow_signups: Boolean
    $arrive_time: timestamptz
    $finish_time: timestamptz
    $food_provided: Boolean
    $summary: String
    $venue_id: bigint
    $notes_band: String
    $notes_admin: String
    $finance: String
    $finance_caller_paid: Boolean
    $finance_payment_received: Boolean
    $finance_deposit_received: Boolean
    $quote_date: date
  ) {
    update_cucb_gigs_by_pk(
      _set: {
        title: $title
        date: $date
        time: $time
        type: $type_id
        admins_only: $admins_only
        advertise: $advertise
        allow_signups: $allow_signups
        arrive_time: $arrive_time
        finish_time: $finish_time
        food_provided: $food_provided
        summary: $summary
        venue_id: $venue_id
        notes_band: $notes_band
        notes_admin: $notes_admin
        quote_date: $quote_date
        finance: $finance
        finance_deposit_received: $finance_deposit_received
        finance_payment_received: $finance_payment_received
        finance_caller_paid: $finance_caller_paid
      }
      pk_columns: { id: $id }
    ) {
      title
      date
      time
      type_id: type
      admins_only
      advertise
      allow_signups
      arrive_time
      finish_time
      food_provided
      summary
      sort_date
      venue_id
      notes_band
      notes_admin
      finance
      finance_deposit_received
      finance_payment_received
      finance_caller_paid
      quote_date
    }
  }
`;

export const QueryContacts = gql`
  query QueryContacts {
    cucb_contacts(order_by: { name: asc, organization: asc }) {
      id
      name
      email
      organization
      caller
    }
  }
`;

export const UpsertGigContact = gql`
  mutation UpsertGigContact($gig_id: bigint, $contact_id: bigint, $calling: Boolean, $client: Boolean) {
    insert_cucb_gigs_contacts_one(
      object: { gig_id: $gig_id, contact_id: $contact_id, calling: $calling, client: $client }
      on_conflict: { constraint: gigs_contacts_pkey, update_columns: [calling, client] }
    ) {
      gig_id
      contact_id
      calling
      client
      contact {
        name
        organization
        email
        notes
        caller
        user_id
      }
    }
  }
`;

export const RemoveGigContact = gql`
  mutation RemoveGigContact($gig_id: bigint!, $contact_id: bigint!) {
    delete_cucb_gigs_contacts_by_pk(contact_id: $contact_id, gig_id: $gig_id) {
      contact_id
      gig_id
    }
  }
`;

export const CreateContact = gql`
  mutation CreateContact($name: String!, $organization: String, $email: String, $caller: Boolean!, $notes: String) {
    insert_cucb_contacts_one(
      object: { name: $name, organization: $organization, email: $email, caller: $caller, notes: $notes }
    ) {
      id
      name
      organization
      email
      caller
      notes
    }
  }
`;

export const UpdateContact = gql`
  mutation UpdateGigContact(
    $id: bigint!
    $name: String!
    $organization: String
    $email: String
    $caller: Boolean!
    $notes: String
  ) {
    update_cucb_contacts_by_pk(
      _set: { name: $name, organization: $organization, email: $email, caller: $caller, notes: $notes }
      pk_columns: { id: $id }
    ) {
      id
      name
      organization
      email
      caller
      notes
    }
  }
`;

export const QueryGigType = gql`
  query QueryGigType($id: bigint!) {
    cucb_gigs_by_pk(id: $id) {
      type: gig_type {
        id
        code
      }
      title
    }
  }
`;

export const QuerySignupSummary = gql`
  query QuerySignupSummary($gig_id: bigint!) {
    cucb_gigs_lineups(where: { gig_id: { _eq: $gig_id } }) {
      user {
        first
        last
      }
      user_available
      user_only_if_necessary
    }
  }
`;
