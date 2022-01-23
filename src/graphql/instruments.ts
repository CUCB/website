import gql from "graphql-tag";

export const AllInstruments = gql`
  query AllInstruments {
    cucb_instruments {
      id
      name
      parent_id
      parent_only
      users_instruments_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

export const UpdateUserInstrument = gql`
  mutation UpdateUserInstrument($id: bigint!, $nickname: String) {
    update_cucb_users_instruments_by_pk(pk_columns: { id: $id }, _set: { nickname: $nickname }) {
      id
      nickname
      instr_id
      instrument {
        id
        name
      }
    }
  }
`;

export const CreateUserInstrument = gql`
  mutation CreateUserInstrument($instr_id: bigint!, $nickname: String, $user_id: bigint!) {
    insert_cucb_users_instruments_one(object: { instr_id: $instr_id, nickname: $nickname, user_id: $user_id }) {
      id
      instr_id
      nickname
      instrument {
        id
        name
      }
    }
  }
`;

export const CreateCurrentUserInstrument = gql`
  mutation CreateCurrentUserInstrument($instr_id: bigint!, $nickname: String) {
    insert_cucb_users_instruments_one(object: { instr_id: $instr_id, nickname: $nickname }) {
      id
      instr_id
      nickname
      instrument {
        id
        name
      }
    }
  }
`;

export const DeleteUserInstrument = gql`
  mutation DeleteUserInstrument($id: bigint!) {
    delete_cucb_users_instruments(
      # Delete the instrument if there is no gig associated with it (i.e. we can't find a gig for this instrument s.t. gig_id is non null)
      where: { _and: [{ id: { _eq: $id } }, { _not: { gigs_lineups_instruments: { gig_id: { _is_null: false } } } }] }
    ) {
      affected_rows
    }
    # ...then try and mark the instrument as deleted, which will only happen if we didn't already delete it
    update_cucb_users_instruments_by_pk(pk_columns: { id: $id }, _set: { deleted: true }) {
      id
      instr_id
      nickname
      deleted
      instrument {
        name
      }
    }
  }
`;

export const RestoreDeletedUserInstrument = gql`
  mutation RestoreDeletedUserInstrument($id: bigint!) {
    update_cucb_users_instruments_by_pk(pk_columns: { id: $id }, _set: { deleted: false }) {
      id
      instr_id
      nickname
      deleted
      instrument {
        name
      }
    }
  }
`;
