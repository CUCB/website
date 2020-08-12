import { makeClient } from "../graphql/client";
import { SMTPClient } from "emailjs";
import escapeHtml from "escape-html";
import fetch from "node-fetch";
import gql from "graphql-tag";

export async function post(req, res, next) {
  const { name, email, bookingEnquiry, occasion, dates, times, venue, message, captchaKey } = req.body;
  const hcaptcha = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: `response=${captchaKey}&secret=${process.env.HCAPTCHA_SECRET}`,
  }).then(res => res.json());

  if (hcaptcha.success) {
    let secretaries;
    try {
      let client = makeClient(fetch);
      const secretaryRes = await client.query(gql`
        query CurrentSec {
          cucb_committees(limit: 1, order_by: { started: desc }, where: { started: { _lte: "now()" } }) {
            committee_members(
              order_by: { committee_position: { position: asc }, name: asc }
              where: { committee_key: { _eq: "secretary" } }
            ) {
              casual_name
              email
            }
          }
        }
      `);
      secretaries =
        secretaryRes &&
        secretaryRes.data &&
        secretaryRes.data.cucb_committees[0] &&
        secretaryRes.data.cucb_committees[0].committee_members;
    } catch {
      // We deal with not found anyway, don't worry about it
    }
    let secretary = secretaries && secretaries[0];
    secretary = secretary || {
      casual_name: "Secretary",
      email: "secretary@cucb.co.uk",
    };

    const client = new SMTPClient({
      host: process.env.EMAIL_POSTFIX_HOST,
      ssl: false,
    });

    const enquiryInformation =
      bookingEnquiry && JSON.parse(bookingEnquiry)
        ? `Booking enquiry information:\n\tOccasion:\t${occasion}\n\tDates:\t\t${dates}\n\tTimes:\t\t${times}\n\tVenue:\t\t${venue}\n\n`
        : `Booking enquiry information:\tNone\n\n`;

    client.send(
      {
        from: `CUCB Online Contact Form <${process.env.EMAIL_SEND_ADDRESS}>`,
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
          res.statusCode = 503;
          res.end(
            `Sorry, we had a problem sending an email. Please email the secretary directly at <a href="mailto:${secretary.email}">${secretary.email}</a>.`,
          );
          console.error(err);
        } else {
          client.send(
            {
              from: `CUCB Online Contact Form <${process.env.EMAIL_SEND_ADDRESS}>`,
              "reply-to": `CUCB Secretary <${secretary.email}>`,
              to: `${email}`,
              subject: `[Cambridge University Ceilidh Band] Confirmation of Message`,
              text: `Dear ${name},\n\nThank you for your e-mail. Our secretary will be in touch as soon as possible!\n\nThe Cambridge University Ceilidh Band\n\nFor your reference:\n\n${enquiryInformation}Message:\n\n\n-----------------------\n\n${escapeHtml(
                message,
              )}\n\n-----------------------\n`,
            },
            (err, _message) => {
              if (err) {
                res.statusCode = 400;
                res.end(
                  `We successfully sent an email to the secretary, but failed to send a receipt to the email address you provided (${email}). If this is incorrect, please email the secretary at ${secretary.email} so they can reply to the correct place.`,
                );
              } else {
                res.statusCode = 204;
                res.end();
              }
            },
          );
        }
      },
    );
  }
}
