export const CreateUser = `
  mutation CreateUser($id: bigint, $username: String!, $email: String!, $saltedPassword: String!, $firstName: String!, $lastName: String!, $admin: Int!, $userInstruments: cucb_users_instruments_arr_rel_insert_input, $bio: String, $bioChangedDate: timestamptz, $userPrefs: cucb_user_prefs_arr_rel_insert_input, $joinDate: timestamptz, $lastLoginDate: timestamptz, $mobileContactInfo: String) {
    insert_cucb_users(
      objects: [{
        id: $id,
        username: $username,
        admin: $admin,
        email: $email,
        salted_password: $saltedPassword,
        first: $firstName,
        last: $lastName,
        user_instruments: $userInstruments
        bio: $bio,
        bio_changed_date: $bioChangedDate,
        user_prefs: $userPrefs,
        join_date: $joinDate,
        last_login_date: $lastLoginDate,
        mobile_contact_info: $mobileContactInfo,
      }],
      on_conflict: {
        constraint: cucb_users_id_key,
        update_columns: [
          username,
          admin,
          email,
          salted_password,
          first,
          last,
          bio,
          bio_changed_date,
          join_date,
          last_login_date,
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
};

export const AllAttributes = `
  query AllAttributes {
    cucb_user_pref_types(where: { name: { _like: "attribute.%" } }) {
      name
      id
    }
  }
`;

export const DeleteUsers = `
    mutation DeleteUsers($ids: [bigint!]!) {
        delete_cucb_gigs_lineups_instruments(where: {user_id: {_in: $ids}}) {
            affected_rows
        }
        delete_cucb_gigs_lineups(where: {user_id: {_in: $ids}}) {
            affected_rows
        }
        delete_cucb_users_instruments(where: {user_id: {_in: $ids}}) {
            affected_rows
        }
        delete_cucb_user_prefs(where: {user_id: {_in: $ids}}) {
            affected_rows
        }
        delete_cucb_users(where: {id: {_in: $ids}}) {
            affected_rows
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

export const DeleteUsersWhere = `
    mutation DeleteUsers($where: cucb_users_bool_exp!) {
        delete_cucb_users(where: $where) {
            affected_rows
        }
    }
`;

export const AppendToList042 = `
    mutation AppendToList042($objects: [cucb_list042_insert_input!]!) {
        insert_cucb_list042(
            objects: $objects
            on_conflict: {
                constraint: list042_pkey
                update_columns: [email]
            }
        ) {
            affected_rows
        }
    }
`;

export const DeleteFromList042 = `
    mutation DeleteFromList042($where: cucb_list042_bool_exp!) {
        delete_cucb_list042(where: $where) {
            affected_rows
        }
    }
`;

export const UserWithUsername = `
    query UserWithUsername($username: String!) {
        cucb_users(where: { username: { _eq: $username } }) {
            id
        }
    }
`;

export const DeleteBiography = `
    mutation DeleteBiography($userId: bigint!) {
      update_cucb_users_by_pk(pk_columns: { id: $userId }, _set: { bio: null }) {
        id
      }
    }
`;

export const SetJoinAndLoginDate = `
    mutation SetJoinAndLoginDate($userId: bigint!, $joinDate: timestamptz, $lastLoginDate: timestamptz) {
      update_cucb_users_by_pk(pk_columns: { id: $userId }, _set: { join_date: $joinDate, last_login_date: $lastLoginDate }) {
        id
      }
    }
`;
