import bcrypt from "bcrypt";
import crypto from "crypto";
import { SMTPClient } from "emailjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Record as RuntypeRecord, String } from "runtypes";
import type { Static } from "runtypes";
import orm from "$lib/database";
import { User } from "./lib/entities/User";
import { List042 } from "./lib/entities/List042";
import { env } from "$env/dynamic/private";

dotenv.config();
if (typeof env["SESSION_SECRET"] === "undefined") {
  console.error("Error: SESSION_SECRET must be defined in .env before running the server");
  process.exit(1);
}
export const SALT_ROUNDS = 10;

const errors = {
  INCORRECT_USERNAME_OR_PASSWORD: {
    message: "Incorrect username or password",
    status: 401,
  },
  INTERNAL_ERROR: {
    message: "Something went wrong. Probably best to let the webmaster know.",
    status: 500,
  },
  NOT_ON_MAILING_LIST: {
    message:
      "The provided email/CRSid is not signed up to the mailing list. If you are signed up, let the webmaster know you've got this error and they should be able to help you out.",
    status: 404,
  },
  ACCOUNT_ALREADY_EXISTS: {
    message: `According to our records, an account with that email/CRSid already exists on the website. Perhaps you want to <a href="/auth/login" data-test=\"login\">login instead</a>?`,
    status: 409,
  },
  TOKEN_EXPIRED: {
    message: `The password reset token has expired. Please generate a new password reset link and try again.`,
    status: 401,
  },
  INVALID_TOKEN: {
    message: `The token provided is not valid.`,
    status: 400,
  },
};

interface LoginData {
  username: string;
  password: string;
}

type SessionData = {
  first: string;
  last: string;
  adminType: {
    hasuraRole: string;
  };
  user_id: string;
};

export const login: (details: LoginData) => Promise<SessionData> = async ({ username, password }) => {
  username = username.toLowerCase().trim();

  try {
    const userRepository = (await orm()).em.fork().getRepository(User);
    const user = await userRepository.findOne({ username });
    if (user) {
      if (user.saltedPassword) {
        let hashedPassword = user.saltedPassword.replace("2y$", "2b$");
        let passwordCorrect = await bcrypt.compare(password, hashedPassword);

        if (passwordCorrect) {
          let { first, last, adminType, id } = user;
          // TODO test last login date works
          await userRepository.nativeUpdate({ id }, { lastLoginDate: new Date() });
          return { first, last, adminType, user_id: id };
        } else {
          throw errors.INCORRECT_USERNAME_OR_PASSWORD;
        }
      } else {
        // TODO cope with this scenario - it should ask user to reset their password
        console.error("User does not have a pasword set");
        throw errors.INTERNAL_ERROR;
      }
    } else {
      throw errors.INCORRECT_USERNAME_OR_PASSWORD;
    }
  } catch (e) {
    if (e.status) throw e;
    console.trace(e);
    throw errors.INTERNAL_ERROR;
  }
};

interface CreateAccountDetails {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}

type NewAccount = { first: string; last: string; adminType: { hasuraRole: string }; id: string };

export const createAccount: (details: CreateAccountDetails) => Promise<NewAccount> = async ({
  username,
  password,
  email,
  firstName,
  lastName,
}) => {
  const userRepository = (await orm()).em.fork().getRepository(User);
  const list042Repository = (await orm()).em.fork().getRepository(List042);
  if (await list042Repository.findOne({ email: { $ilike: mysql_real_escape_string(email) } })) {
    username = username.toLowerCase();
    email = email.toLowerCase();
    const saltedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    // Discard password before we accidentally do anything stupid
    password = "";
    try {
      const user = userRepository.create({
        username,
        saltedPassword,
        first: firstName,
        last: lastName,
        email,
      });
      await userRepository.persistAndFlush(user);
      const { first, last, adminType, id } = user;
      return { first, last, adminType, id };
    } catch (e) {
      if (e.detail.match(/already exists/i)) {
        throw errors.ACCOUNT_ALREADY_EXISTS;
      } else {
        console.trace(e);
        throw errors.INTERNAL_ERROR;
      }
    }
  } else {
    throw errors.NOT_ON_MAILING_LIST;
  }
};

export const PasswordResetToken = RuntypeRecord({
  id: String,
  email: String,
});

export async function startPasswordReset({
  id,
  first,
  last,
  email,
}: {
  id: string;
  first: string;
  last: string;
  email: string;
}): Promise<void> {
  const payload: Static<typeof PasswordResetToken> = { id, email };
  const token = jwt.sign(payload, env["SESSION_SECRET"] as string, { expiresIn: "1 hour" });
  const emailClient = new SMTPClient({
    host: env["EMAIL_HOST"],
    ssl: env["EMAIL_SSL"] !== "true" ? false : undefined,
    tls:
      env["EMAIL_SSL"] === "true"
        ? {
            ciphers: "SSLv3",
          }
        : undefined,
    port: JSON.parse(env["EMAIL_PORT"] as string) as number,
    user: env["EMAIL_USERNAME"],
    password: env["EMAIL_PASSWORD"],
  });
  const link = `https://www.cucb.co.uk/auth/reset-password?token=${token}`;
  const text = `A password reset has been requested for your account. To choose a new password, go to ${link}. If you have any problems, please get in touch with the webmaster by replying to this email.`;
  const html = `A password reset has been requested for your account. To choose a new password, go to <a href="${link}">${link}</a>. If you have any problems, please get in touch with the webmaster by replying to this email.`;
  try {
    await emailClient.sendAsync({
      from: `CUCB Webmaster <${env["EMAIL_SEND_ADDRESS"]}>`,
      "reply-to": `CUCB Webmaster <${env["EMAIL_SEND_ADDRESS"]}>`,
      to: `${first} ${last} <${email}>`,
      subject: `CUCB — Password Reset`,
      text: `Hi ${first},

${text}

Thanks,
CUCB Webmaster\n`,
      attachment: [
        { data: `<html><p>Hi ${first},</p><p>${html}</p><p>Thanks,<br>CUCB Webmaster</p>`, alternative: true },
      ],
    });
  } catch (err) {
    console.error(`Error sending password reset email: ${err.message}`);
    throw errors.INTERNAL_ERROR;
  }
}

export async function completePasswordReset({ password, token }: { password: string; token: string }): Promise<void> {
  let decoded;
  try {
    decoded = jwt.verify(token, env["SESSION_SECRET"] as string);
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      throw errors.TOKEN_EXPIRED;
    } else {
      throw errors.INVALID_TOKEN;
    }
  }

  const saltedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  // Discard password before we accidentally do anything stupid
  password = "";
  if (PasswordResetToken.guard(decoded)) {
    try {
      const userRepository = (await orm()).em.fork().getRepository(User);
      await userRepository.nativeUpdate({ id: decoded.id }, { saltedPassword });
    } catch (e) {
      console.trace(e);
      throw errors.INTERNAL_ERROR;
    }
  } else {
    console.trace(decoded);
  }
}

// A Javascript port of a PHP function, copied from somewhere on the internet...
// Don't know where, but is useful to escape, % symbols so we can use ilike for a case insensitive match
function mysql_real_escape_string(str: string) {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char: string) {
    switch (char) {
      case "\0":
        return "\\0";
      case "\x08":
        return "\\b";
      case "\x09":
        return "\\t";
      case "\x1a":
        return "\\z";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case '"':
      case "'":
      case "\\":
      case "%":
        return "\\" + char; // prepends a backslash to backslash, percent,
      // and double/single quotes
      default:
        return char;
    }
  });
}
