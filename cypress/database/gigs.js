export const CreateGig = `
  mutation CreateGig($id: bigint, $title: String!, $type: bigint!) {
    insert_cucb_gigs(
      objects: [{
        id: $id,
        title: $title,
        type: $type,
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
