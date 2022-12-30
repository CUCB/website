import { SMTPClient } from "emailjs";
import { escape as escapeHtml } from "html-escaper";
import dotenv from "dotenv";
import type { RequestHandler } from "./$types";
import { error } from "@sveltejs/kit";
import fetch from "node-fetch";
import { Committee } from "$lib/entities/Committee";
import orm from "$lib/database";
import { LoadStrategy } from "@mikro-orm/core";
import { env } from "$env/dynamic/private";
dotenv.config();

export const POST: RequestHandler = async ({ request }) => {
  const { name, email, bookingEnquiry, occasion, dates, times, venue, message, captchaKey } = Object.fromEntries(
    await request.formData(),
  ) as Record<string, string>;
  let hcaptcha: { success: boolean } | {};
  const body = new URLSearchParams();
  body.append("response", captchaKey.toString());
  body.append("secret", env["HCAPTCHA_SECRET"]);
  try {
    hcaptcha = (await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body,
    }).then((res) => res.json())) as typeof hcaptcha;
  } catch (e) {
    console.error(e);
    throw error(
      500,
      `Sorry, we had a problem sending an email. Please email the secretary directly at <a href="mailto:secretary@cucb.co.uk">secretary@cucb.co.uk</a>.`,
    );
  }

  let secretaries;
  try {
    const committeeRepository = (await orm()).em.fork().getRepository(Committee);
    secretaries = await committeeRepository
      .findOne(
        { started: { $lte: "now()" }, members: { lookup_name: { name: "secretary" } } },
        {
          fields: ["members.casual_name", "members.email", "members.lookup_name", "members.lookup_name.name"],
          strategy: LoadStrategy.JOINED,
        },
      )
      .then((committee) => committee?.members?.toArray());
  } catch (e) {
    // We deal with not found anyway, don't worry about it
    console.error("Failed to find secretary email");
    console.error(e);
  }
  const secretary = {
    casualName: secretaries?.[0].casual_name || "Secretary",
    email: secretaries?.[0].email || "secretary@cucb.co.uk",
  };

  if ("success" in hcaptcha && hcaptcha.success) {
    const client = new SMTPClient({
      host: env["EMAIL_HOST"],
      ssl: env["EMAIL_SSL"] !== "true" ? false : undefined,
      tls:
        env["EMAIL_SSL"] === "true"
          ? {
              ciphers: "SSLv3",
            }
          : undefined,
      port: parseInt(env["EMAIL_PORT"]),
      user: env["EMAIL_USERNAME"],
      password: env["EMAIL_PASSWORD"],
    });

    const enquiryInformation =
      bookingEnquiry && JSON.parse(bookingEnquiry)
        ? `Booking enquiry information:\n\tOccasion:\t${occasion}\n\tDates:\t\t${dates}\n\tTimes:\t\t${times}\n\tVenue:\t\t${venue}\n\n`
        : `Booking enquiry information:\tNone\n\n`;

    const sendSecretaryEmail = new Promise((resolve, reject) =>
      client.send(
        {
          from: `CUCB Online Contact Form <${env["EMAIL_SEND_ADDRESS"]}>`,
          "reply-to": `${name.trim()} <${email.trim()}>`,
          to: `CUCB Secretary <${secretary.email}>`,
          subject: `${name} — Online Enquiry`,
          text: `Hello ${
            secretary.casualName
          }!\n\nYou have been sent the following enquiry by ${name} (${email}).\n\n${enquiryInformation}Message:\n\n\n-----------------------\n\n${escapeHtml(
            message,
          )}\n\n-----------------------\n\nMany thanks!\n`,
        },
        (err, _message) => {
          if (err) {
            console.error(err);
            reject(
              error(
                503,
                `Sorry, we had a problem sending an email. Please email the secretary directly at <a href="mailto:${secretary.email}">${secretary.email}</a>.`,
              ),
            );
          } else {
            resolve(null);
          }
        },
      ),
    );
    const sendClientEmail = new Promise((resolve, reject) =>
      client.send(
        {
          from: `CUCB Online Contact Form <${env["EMAIL_SEND_ADDRESS"]}>`,
          "reply-to": `CUCB Secretary <${secretary.email}>`,
          to: `${email}`,
          subject: `[Cambridge University Ceilidh Band] Confirmation of Message`,
          text: `Dear ${name},\n\nThank you for your e-mail.\n\n Our secretary will be in touch as soon as possible!\n\nThe Cambridge University Ceilidh Band\n\nFor your reference:\n\n${enquiryInformation}Message:\n\n\n-----------------------\n\n${escapeHtml(
            message,
          )}\n\n-----------------------\n`,
        },
        (err, _message) => {
          if (err) {
            reject(
              error(
                400,
                `We successfully sent an email to our secretary, but failed to send a receipt to the email address you provided (${email}). If this is incorrect, please email the secretary at ${secretary.email} so they can reply to the correct place.`,
              ),
            );
          } else {
            resolve(null);
          }
        },
      ),
    );

    await sendSecretaryEmail;
    await sendClientEmail;
    return new Response("");
  } else {
    console.error("Captcha verification failed: " + captchaKey);
    throw error(
      400,
      `Sorry, we had a problem sending an email. Please email our secretary directly at <a href="mailto:${secretary.email}">${secretary.email}</a>.`,
    );
  }
};
