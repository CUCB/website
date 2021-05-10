import { SMTPClient } from "emailjs";
import fetch from "node-fetch";
import gql from "graphql-tag";
import dotenv from "dotenv";
import { makeGraphqlClient } from "../auth";
dotenv.config();

export async function post({ body }) {
  try {
    console.log(body);
    const res = await realpost(body);
    console.log(res);
    return { status: 500, body: "Something else went wrong", ...res };
  } catch (e) {
    console.error(e);
    return { status: 500, body: "Something went wrong." };
  }
}
async function realpost(body) {
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
    let client = makeGraphqlClient();
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
        host: process.env["EMAIL_POSTFIX_HOST"],
        ssl: false,
        port: process.env["EMAIL_POSTFIX_PORT"],
      });
    } catch (e) {
      console.error("Failed to make SMTP client");
      console.error(`Tried to connect to ${process.env.EMAIL_POSTFIX_HOST}:${process.env.EMAIL_POSTFIX_PORT}`);
      return {
        status: 500,
        body: `Sorry, we encountered a problem. Please email the webmaster directly at <a href="mailto:${webmaster.email}">${webmaster.email}</a> giving your name, email address and the names of the lists you wish to join, plus your reason for joining (if relevant).`,
      };
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
            console.error(err);
            reject({
              status: 503,
              body: `Sorry, we encountered a problem. Please email the webmaster directly at <a href="mailto:${webmaster.email}">${webmaster.email}</a> giving your name, email address and the names of the lists you wish to join, plus your reason for joining (if relevant).`,
            });
          } else {
            resolve(null);
          }
        },
      ),
    );

    try {
      await emailPromise;
      return { status: 204, body: "" };
    } catch (e) {
      return e;
    }
  } else {
    console.error("Failed to verify captcha response: " + captchaKey);
    return {
      status: 400,

      body: `Sorry, we encountered a problem. Please email the webmaster directly at <a href="mailto:${webmaster.email}">${webmaster.email}</a> giving your name, email address and the names of the lists you wish to join, plus your reason for joining (if relevant).`,
    };
  }
}
