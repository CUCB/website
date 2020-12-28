export const CreateGig = `
  mutation CreateGig(
      $id: bigint
      $title: String!
      $type: bigint! = 1
      $adminsOnly: Boolean
      $allowSignups: Boolean = false
      $lineup: cucb_gigs_lineups_arr_rel_insert_input
      $date: date
      $time: time
      $summary: String
      $notesAdmin: String
      $notesBand: String
      $venue: cucb_gig_venues_obj_rel_insert_input
      $finance: String
      $arriveTime: timestamptz
      $finishTime: timestamptz
      $depositReceived: Boolean
      $paymentReceived: Boolean
      $callerPaid: Boolean
    ) {
    insert_cucb_gigs(
      objects: [{
        id: $id
        title: $title
        type: $type
        admins_only: $adminsOnly
        allow_signups: $allowSignups
        lineup: $lineup
        date: $date
        time: $time
        summary: $summary
        notes_admin: $notesAdmin
        notes_band: $notesBand
        venue: $venue
        arrive_time: $arriveTime
        finish_time: $finishTime
        finance_deposit_received: $depositReceived
        finance_payment_received: $paymentReceived
        finance_caller_paid: $callerPaid
        finance: $finance
      }],
      on_conflict: {
        constraint: cucb_gigs_id_key,
        update_columns: [
          title
          type
          allow_signups
          admins_only
          date
          time
          summary
          notes_admin
          notes_band
          venue_id
          arrive_time
          finish_time
          finance_deposit_received
          finance_payment_received
          finance_caller_paid
          finance
        ]
      }) {
      affected_rows
    }
  }
`;

export const DeleteSignup = `
  mutation DeleteSignup($userId: bigint!, $gigId: bigint!) {
    delete_cucb_gigs_lineups_by_pk(gig_id: $gigId, user_id: $userId) {
        gig_id
    }
  }
`;

export const SignupDetails = `
  query SignupDetails($gigId: bigint!, $userId: bigint!) {
    cucb_gigs_lineups_by_pk(gig_id: $gigId, user_id: $userId) {
      user_notes
      user_only_if_necessary
      user_available
      user_instruments {
        user_instrument_id
      }
    }
  }
`;

export const AddInstrument = `
  mutation AddInstrument($instrumentId: bigint!, $nickname: String, $userId: bigint) {
    insert_cucb_users_instruments(
      objects: { instr_id: $instrumentId, nickname: $nickname, user_id: $userId }
      on_conflict: { constraint: cucb_users_instruments_id_key, update_columns: nickname }
    ) {
      affected_rows
    }
  }
`;

export const RemoveInstruments = `
  mutation RemoveInstruments($userId: bigint) {
    delete_cucb_gigs_lineups_instruments(where: { user_id: { _eq: $userId } }) {
      affected_rows
    }
    delete_cucb_users_instruments(where: { user_id: { _eq: $userId } }) {
      affected_rows
    }
  }
`;

export const InstrumentsOnGig = `
  query InstrumentsOnGig($userId: bigint!, $gigId: bigint!) {
    cucb_gigs_lineups_instruments_aggregate(where: { user_id: { _eq: $userId }, gig_id: { _eq: $gigId } }) {
      aggregate {
        count
      }
    }
  }
`;

export const onConflictVenue = {
  constraint: "cucb_gig_venues_id_key",
  update_columns: [
    "address",
    "distance_miles",
    "latitude",
    "longitude",
    "map_link",
    "name",
    "notes_admin",
    "notes_band",
    "postcode",
    "subvenue",
  ],
};

export const CreateVenues = `
  mutation CreateVenues($venues: [cucb_gig_venues_insert_input!]!, $on_conflict: cucb_gig_venues_on_conflict) {
    insert_cucb_gig_venues(objects: $venues, on_conflict: $on_conflict) {
      affected_rows
    }
  }
`;

export const CreateContacts = `
  mutation CreateContacts($contacts: [cucb_contacts_insert_input!]!) {
    insert_cucb_contacts(objects: $contacts, on_conflict: {
      constraint: cucb_contacts_id_key,
      update_columns: [
        caller
        email
        name
        notes
        organization
        user_id
      ]
    }) {
      affected_rows
    }
  }
`;

export const ClearContactsForGig = `
  mutation ClearContactsForGig($gig_id: bigint!) {
    delete_cucb_gigs_contacts(where: { gig_id: { _eq: $gig_id } }) {
      affected_rows
    }
  }
`;

export const DeleteContacts = `
  mutation DeleteContacts($where: cucb_contacts_bool_exp!) {
    delete_cucb_contacts(where: $where) {
      affected_rows
    }
  }
`;

export const DeleteVenues = `
  mutation DeleteVenues($where: cucb_gig_venues_bool_exp!) {
    delete_cucb_gig_venues(where: $where) {
      affected_rows
    }
  }
`;
