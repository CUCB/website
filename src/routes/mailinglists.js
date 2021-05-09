import { makeClient } from "../graphql/client";
import { SMTPClient } from "emailjs";
import fetch from "node-fetch";
import gql from "graphql-tag";
import dotenv from "dotenv";
dotenv.config();

export async function post({ body }) {
    try {
    return await realpost(body);
    } catch(e) {
        console.error(e);
        return { status: 500, body: "Something went wrong."}
    }
}
async function realpost(body) {
  const { name, email, lists, captchaKey } = Object.fromEntries(body.entries());
  const hcaptcha = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: `response=${captchaKey}&secret=${process.env["HCAPTCHA_SECRET"]}`,
  }).then(res => res.json());

  if (hcaptcha.success) {
    let webmasters;
    try {
      let client = makeClient(fetch);
      const webmasterRes = await client.query(gql`
        query CurrentSec {
          cucb_committees(limit: 1, order_by: { started: desc }, where: { started: { _lte: "now()" } }) {
            committee_members(
              order_by: { committee_position: { position: asc }, name: asc }
              where: { committee_key: { _eq: "webmaster" } }
            ) {
              casual_name
              email
            }
          }
        }
      `);
      webmasters =
        webmasterRes &&
        webmasterRes.data &&
        webmasterRes.data.cucb_committees[0] &&
        webmasterRes.data.cucb_committees[0].committee_members;
    } catch(e) {
      // We deal with not found anyway, don't worry about it
      console.error("Couldn't retrieve webmaster's email address: " + e)
    }
    let webmaster = webmasters && webmasters[0];
    webmaster = webmaster || {
      casual_name: "Webmaster",
      email: "webmaster@cucb.co.uk",
    };

    let client;
    try {
        client = new SMTPClient({
            host: process.env.EMAIL_POSTFIX_HOST,
            ssl: false,
            port: process.env.EMAIL_POSTFIX_PORT,
        });
    }catch(e) {
        console.error("Failed to make SMTP client")
        console.error(`Tried to connect to ${process.env.EMAIL_POSTFIX_HOST}:${process.env.EMAIL_POSTFIX_PORT}`)
        return {
            status: 500,
            body: `Sorry, we encountered a problem. Please email the webmaster directly at <a href="mailto:${webmaster.email}">${webmaster.email}</a> giving your name, email address and the names of the lists you wish to join, plus your reason for joining (if relevant).`,
        }
    }

    const emailPromise = new Promise((resolve, reject) => client.send(
      {
        from: `CUCB Website <${process.env["EMAIL_SEND_ADDRESS"]}>`,
        to: `CUCB Webmaster <${webmaster.email}>`,
        subject: `Request to join mailing lists`,
        text: `${name}\n${email}\nWishes to join the following lists\n${JSON.parse(lists).map(list => `\t${list}\n`)}`,
      },
      (err, message) => {
        // TODO process the error and feed back to the client
        if (err) {
          console.error(err);
          reject({
            status: 503,
            body: `Sorry, we encountered a problem. Please email the webmaster directly at <a href="mailto:${webmaster.email}">${webmaster.email}</a> giving your name, email address and the names of the lists you wish to join, plus your reason for joining (if relevant).`,
          })
        } else {
          resolve(null);
        }
      },
    ));

    try {
        await emailPromise;
        return { status: 204 };
    } catch(e) {
        return e;
    }
  }
}
