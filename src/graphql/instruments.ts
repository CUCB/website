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
  mutation CreateUserInstrument($instr_id: bigint!, $nickname: String) {
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
