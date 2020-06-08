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
        constraint: idx_17515_primary,
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
    abc123: "$2b$10$fsfeK3cSN/04rNTVm3dkNuKaaFzo/Xj6HBBzgi1uooabY7XX1vABq"
}