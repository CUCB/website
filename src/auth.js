import { Pool } from "pg";
import bcrypt from "bcrypt";

let _cachedPool;
export let pool = () => {
  return (_cachedPool =
    _cachedPool ||
    new Pool({
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: process.env.PG_PORT,
      max: 5,
    }));
};

const errors = {
  INCORRECT_USERNAME_OR_PASSWORD: {
    message: "Incorrect username or password",
    status: 401,
  },
};

export const login = async ({ username, password }) =>
  pool()
    .query(
      "\
        SELECT salted_password, first, last, hasura_role, cucb.users.id as user_id\
        FROM cucb.users\
        JOIN cucb.auth_user_types\
            ON cucb.auth_user_types.id = cucb.users.admin WHERE username=$1",
      [username],
    )
    .then(async res => {
      let hashedPassword = res && res.rows[0] && res.rows[0].salted_password.replace("$2y$", "$2b$");
      let passwordCorrect = await bcrypt.compare(password, hashedPassword);
      if (passwordCorrect) {
        return res;
      } else {
        throw new Error(errors.INCORRECT_USERNAME_OR_PASSWORD);
      }
    })
    .then(result => ({ ...result.rows[0], salted_password: undefined }));
