import { SMTPClient } from "emailjs";
import gql from "graphql-tag";
import dotenv from "dotenv";
import { error } from "@sveltejs/kit";
dotenv.config();

export async function POST({ body, fetch }) {
  try {
    return await realpost(body, fetch);
  } catch (e) {
    if (e.code) {
      throw e;
    } else {
      console.error("Unhandled exception in POST /mailinglists");
      console.error(e);
      throw error(500, "Something went wrong.");
    }
  }
}

async function realpost(body, fetch) {
  const { name, email, lists, captchaKey } = Object.fromEntries(body.entries?.() || Object.entries(body));
  const hcaptcha = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: `response=${captchaKey}&secret=${process.env["HCAPTCHA_SECRET"]}`,
  }).then((res) => res.json());

  let webmasters;
  try {
    let client = new GraphQLClient(fetch);
    const webmasterRes = await client.query({
      query: gql`
        query CurrentSec {
          cucb_committees(limit: 1, order_by: { started: desc }, where: { started: { _lte: "now()" } }) {
            committee_members(
              order_by: { committee_position: { position: asc }, name: asc }
              where: { committee_key: { name: { _eq: "webmaster" } } }
            ) {
              casual_name
              email
            }
          }
        }
      `,
    });
    webmasters = webmasterRes?.data?.cucb_committees?.[0]?.committee_members;
  } catch (e) {
    // We deal with not found anyway, don't worry about it
    console.error("Couldn't retrieve webmaster's email address: " + e);
    console.error(e);
  }
  const webmaster = webmasters?.[0] || {
    casual_name: "Webmaster",
    email: "webmaster@cucb.co.uk",
  };

  if (hcaptcha.success) {
    let client;
    try {
      client = new SMTPClient({
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
    } catch (e) {
      console.error("Failed to make SMTP client");
      console.error(`Tried to connect to ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
      throw error(
        500,
        `Sorry, we encountered a problem. Please email the webmaster directly at <a href="mailto:${webmaster.email}">${webmaster.email}</a> giving your name, email address and the names of the lists you wish to join, plus your reason for joining (if relevant).`,
      );
    }

    const emailPromise = new Promise((resolve, reject) =>
      client.send(
        {
          from: `CUCB Website <${process.env["EMAIL_SEND_ADDRESS"]}>`,
          to: `CUCB Webmaster <${webmaster.email}>`,
          subject: `Request to join mailing lists`,
          text: `${name}\n${email}\nWishes to join the following lists\n${JSON.parse(lists).map(
            (list) => `\t${list}\n`,
          )}`,
        },
        (err, message) => {
          // TODO process the error and feed back to the client
          if (err) {
            console.error("Error sending mailing list email");
            console.error(err);
            reject(
              error(
                503,
                `Sorry, we encountered a problem. Please email the webmaster directly at <a href="mailto:${webmaster.email}">${webmaster.email}</a> giving your name, email address and the names of the lists you wish to join, plus your reason for joining (if relevant).`,
              ),
            );
          } else {
            resolve(null);
          }
        },
      ),
    );

    await emailPromise;
    return new Response("");
  } else {
    console.error("Failed to verify captcha response: " + captchaKey);
    throw error(
      400,
      `Sorry, we encountered a problem. Please email the webmaster directly at <a href="mailto:${webmaster.email}">${webmaster.email}</a> giving your name, email address and the names of the lists you wish to join, plus your reason for joining (if relevant).`,
    );
  }
}