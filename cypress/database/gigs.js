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

export const DeleteGig = `
  mutation DeleteGig($id: bigint!) {
    delete_cucb_gigs_lineups_instruments(where: { gig_id: { _eq: $id } }) {
        affected_rows
    }
    delete_cucb_gigs_lineups(where: { gig_id: { _eq: $id } }) {
        affected_rows
    }
    delete_cucb_gigs_by_pk(id: $id) {
        id
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

// A massive mutation for the gig editor tests
export const SetResetGig = `
  mutation SetResetGig(
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
      $callerPaid: Boolean,
      $where_delete_venues: cucb_gig_venues_bool_exp!,
      $where_delete_contacts: cucb_contacts_bool_exp!
      $create_contacts: [cucb_contacts_insert_input!]!,
      $create_venues: [cucb_gig_venues_insert_input!]!
  ) {
    delete_cucb_gigs_contacts(where: { gig_id: { _eq: $id } }) {
      affected_rows
    }
    delete_cucb_contacts(where: $where_delete_contacts) {
      affected_rows
    }
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
    delete_cucb_gig_venues(where: $where_delete_venues) {
      affected_rows
    }
    insert_cucb_contacts(objects: $create_contacts, on_conflict: {
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
    insert_cucb_gig_venues(objects: $create_venues, on_conflict: {
      constraint: cucb_gig_venues_id_key,
      update_columns: [
        address,
        distance_miles,
        latitude,
        longitude,
        map_link,
        name,
        notes_admin,
        notes_band,
        postcode,
        subvenue,
      ],
    }) {
      affected_rows
    }
  }
`;

export const UpdateGigType = `
    mutation UpdateGigType($gigId: bigint!, $typeId: bigint!) {
        update_cucb_gigs(_set: { type: $typeId }, where: { id: {_eq: $gigId } }) {
            affected_rows
        }    
    }
`;

export const AllGigTypes = `
    query AllGigTypes {
        cucb_gig_types {
            id
            code
            title
        }
    }
`;

export const ClearLineupForGig = `
    mutation ClearLineupForGig($id: bigint!) {
        delete_cucb_gigs_lineups(where: {gig_id: {_eq: $id}}) {
            affected_rows
        }
    }
`