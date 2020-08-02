export const AddCommittee = `
  mutation AddCommittee(
    $id: bigint
    $started: timestamptz
    $data: cucb_committee_members_arr_rel_insert_input!
  ) {
    insert_cucb_committees_one(
      object: { id: $id, pic_folder: "", started: $started, committee_members: $data }
      on_conflict: { constraint: cucb_committees_id_key, update_columns: started }
    ) {
      id
    }
  }
`;
