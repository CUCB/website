export const CreateGig = `
  mutation CreateGig($id: bigint, $title: String!, $type: bigint!, $adminsOnly: Boolean) {
    insert_cucb_gigs(
      objects: [{
        id: $id,
        title: $title,
        type: $type,
        admins_only: $adminsOnly,
      }],
      on_conflict: {
        constraint: idx_17399_primary,
        update_columns: [
          title
          type
        ]
      }) {
      affected_rows
    }
  }
`;
