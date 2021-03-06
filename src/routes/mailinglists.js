import { makeClient } from "../graphql/client";
import { SMTPClient } from "emailjs";
import fetch from "node-fetch";
import gql from "graphql-tag";

export async function post(req, res, next) {
  const { name, email, lists, captchaKey } = req.body;
  const hcaptcha = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: `response=${captchaKey}&secret=${process.env.HCAPTCHA_SECRET}`,
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
    } catch {
      // We deal with not found anyway, don't worry about it
    }
    let webmaster = webmasters && webmasters[0];
    webmaster = webmaster || {
      casual_name: "Webmaster",
      email: "webmaster@cucb.co.uk",
    };

    const client = new SMTPClient({
      host: process.env.EMAIL_POSTFIX_HOST,
      ssl: false,
      port: process.env.EMAIL_POSTFIX_PORT,
    });

    client.send(
      {
        from: `CUCB Website <${process.env.EMAIL_SEND_ADDRESS}>`,
        to: `CUCB Webmaster <${webmaster.email}>`,
        subject: `Request to join mailing lists`,
        text: `${name}\n${email}\nWishes to join the following lists\n${JSON.parse(lists).map(list => `\t${list}\n`)}`,
      },
      (err, message) => {
        // TODO process the error and feed back to the client
        if (err) {
          res.statusCode = 503;
          res.end(
            `Sorry, we encountered a problem. Please email the webmaster directly at <a href="mailto:${webmaster.email}">${webmaster.email}</a> giving your name, email address and the names of the lists you wish to join, plus your reason for joining (if relevant).`,
          );
          console.error(err);
        } else {
          res.statusCode = 204;
          res.end();
        }
      },
    );
  }
}
