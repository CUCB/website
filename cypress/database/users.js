export const CreateUser = `
  mutation CreateUser($id: bigint, $username: String!, $email: String!, $saltedPassword: String!, $firstName: String!, $lastName: String!, $admin: Int!) {
    insert_cucb_users(
      objects: [{
        id: $id,
        username: $username,
        admin: $admin,
        email: $email,
        salted_password: $saltedPassword,
        first: $firstName,
        last: $lastName
      }],
      on_conflict: {
        constraint: cucb_users_id_key,
        update_columns: [
          username,
          admin,
          email,
          salted_password,
          first,
          last
        ]
      }) {
      affected_rows
    }
  }
`;

export const HASHED_PASSWORDS = {
  abc123: "$2b$10$fsfeK3cSN/04rNTVm3dkNuKaaFzo/Xj6HBBzgi1uooabY7XX1vABq",
};

export const OnConflictUser = {
  constraint: "cucb_users_id_key",
  update_columns: ["username", "admin", "email", "salted_password", "first", "last"],
};

export const OnConflictUserPrefs = {
  constraint: "cucb_user_prefs_user_id_pref_id_key",
  update_columns: ["value"],
}

export const AllAttributes = `
  query AllAttributes {
    cucb_user_pref_types(where: { name: { _like: "attribute.%" } }) {
      name
      id
    }
  }
`;

export const CreateLineup = `
  mutation CreateLineup($entries: [cucb_gigs_lineups_insert_input!]!) {
    insert_cucb_gigs_lineups(
      objects: $entries
      on_conflict: {
        constraint: gigs_lineups_pkey
        update_columns: [
          admin_notes
          approved
          driver
          equipment
          gig_id
          leader
          money_collector
          money_collector_notified
          user_available
          user_id
          user_notes
          user_only_if_necessary
        ]
      }
    ) {
      affected_rows
    }
  }
`;