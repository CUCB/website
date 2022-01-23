import { makeServerGraphqlClient } from "../auth";
import { SMTPClient } from "emailjs";
import escapeHtml from "escape-html";
import fetch from "node-fetch";
import gql from "graphql-tag";
import dotenv from "dotenv";
dotenv.config();

export async function post({ body }) {
  const { name, email, bookingEnquiry, occasion, dates, times, venue, message, captchaKey } = Object.fromEntries(
    body?.entries() || Object.entries(body),
  );
  let hcaptcha;
  try {
    hcaptcha = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: `response=${captchaKey}&secret=${process.env["HCAPTCHA_SECRET"]}`,
    }).then((res) => res.json());
  } catch (e) {
    console.error(e);
    return {
      status: 500,
      body: `Sorry, we had a problem sending an email. Please email the secretary directly at <a href="mailto:secretary@cucb.co.uk">secretary@cucb.co.uk</a>.`,
    };
  }

  if (hcaptcha.success) {
    let secretaries;
    try {
      let client = makeServerGraphqlClient();
      const secretaryRes = await client.query({
        query: gql`
          query CurrentSec {
            cucb_committees(limit: 1, order_by: { started: desc }, where: { started: { _lte: "now()" } }) {
              committee_members(
                order_by: { committee_position: { position: asc }, name: asc }
                where: { committee_key: { name: { _eq: "secretary" } } }
              ) {
                casual_name
                email
              }
            }
          }
        `,
      });
      secretaries = secretaryRes?.data?.cucb_committees?.[0]?.committee_members;
    } catch (e) {
      // We deal with not found anyway, don't worry about it
      console.error("Failed to find secretary email");
      console.error(e);
    }
    const secretary = secretaries?.[0] || {
      casual_name: "Secretary",
      email: "secretary@cucb.co.uk",
    };

    const client = new SMTPClient({
      host: process.env["EMAIL_HOST"],
      ssl: process.env["EMAIL_SSL"] !== "true" ? false : undefined,
      tls:
        process.env["EMAIL_SSL"] === "true"
          ? {
              ciphers: "SSLv3",
            }
          : undefined,
      port: parseInt(process.env["EMAIL_PORT"]),
      user: process.env["EMAIL_USERNAME"],
      password: process.env["EMAIL_PASSWORD"],
    });

    const enquiryInformation =
      bookingEnquiry && JSON.parse(bookingEnquiry)
        ? `Booking enquiry information:\n\tOccasion:\t${occasion}\n\tDates:\t\t${dates}\n\tTimes:\t\t${times}\n\tVenue:\t\t${venue}\n\n`
        : `Booking enquiry information:\tNone\n\n`;

    const sendSecretaryEmail = new Promise((resolve, reject) =>
      client.send(
        {
          from: `CUCB Online Contact Form <${process.env["EMAIL_SEND_ADDRESS"]}>`,
          "reply-to": `${name.trim()} <${email.trim()}>`,
          to: `CUCB Secretary <${secretary.email}>`,
          subject: `${name} — Online Enquiry`,
          text: `Hello ${
            secretary.casual_name
          }!\n\nYou have been sent the following enquiry by ${name} (${email}).\n\n${enquiryInformation}Message:\n\n\n-----------------------\n\n${escapeHtml(
            message,
          )}\n\n-----------------------\n\nMany thanks!\n`,
        },
        (err, _message) => {
          if (err) {
            console.error(err);
            reject({
              status: 503,
              body: `Sorry, we had a problem sending an email. Please email the secretary directly at <a href="mailto:${secretary.email}">${secretary.email}</a>.`,
            });
          } else {
            resolve(null);
          }
        },
      ),
    );
    const sendClientEmail = new Promise((resolve, reject) =>
      client.send(
        {
          from: `CUCB Online Contact Form <${process.env["EMAIL_SEND_ADDRESS"]}>`,
          "reply-to": `CUCB Secretary <${secretary.email}>`,
          to: `${email}`,
          subject: `[Cambridge University Ceilidh Band] Confirmation of Message`,
          text: `Dear ${name},\n\nThank you for your e-mail.\n\n Our secretary will be in touch as soon as possible!\n\nThe Cambridge University Ceilidh Band\n\nFor your reference:\n\n${enquiryInformation}Message:\n\n\n-----------------------\n\n${escapeHtml(
            message,
          )}\n\n-----------------------\n`,
        },
        (err, _message) => {
          if (err) {
            reject({
              status: 400,
              body: `We successfully sent an email to the secretary, but failed to send a receipt to the email address you provided (${email}). If this is incorrect, please email the secretary at ${secretary.email} so they can reply to the correct place.`,
            });
          } else {
            resolve(null);
          }
        },
      ),
    );

    try {
      await sendSecretaryEmail;
      await sendClientEmail;
      return { status: 204, body: "" };
    } catch (e) {
      return e;
    }
  } else {
    console.error("Captcha verification failed: " + captchaKey);
    return {
      status: 400,
      body: `Sorry, we had a problem sending an email. Please email the secretary directly at <a href="mailto:${secretary.email}">${secretary.email}</a>.`,
    };
  }
}
