import { Message, SMTPClient } from "emailjs";
import dotenv from "dotenv";
import { error } from "@sveltejs/kit";
import fetch from "node-fetch";
import { env } from "$env/dynamic/private";
import { Committee } from "$lib/entities/Committee";
import type { RequestEvent } from "./$types";
import orm from "$lib/database";
import { PopulateHint } from "@mikro-orm/core";
import { Boolean, Record, Array, String } from "runtypes";
dotenv.config();

// TODO make sure I'm tested
export const POST = async ({ request }: RequestEvent): Promise<Response> => {
  try {
    return await realpost(request);
  } catch (e) {
    if (e.code) {
      throw e;
    } else {
      console.error("Unhandled exception in POST /mailinglists");
      console.error(e);
      throw error(500, "Something went wrong.");
    }
  }
};

const HcaptchaResponse = Record({ success: Boolean });

async function realpost(request: Request) {
  const { name, email, lists, captchaKey } = Object.fromEntries(await request.formData());
  const hcaptcha = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: `response=${captchaKey}&secret=${env["HCAPTCHA_SECRET"]}`,
  })
    .then((res) => res.json())
    .then(HcaptchaResponse.check);

  let webmasters;
  try {
    // TODO make sure queries like this actually pick the latest committee, but not future committees
    const committeeRepository = orm.em.fork().getRepository(Committee);
    const committee = await committeeRepository.findOne(
      { started: { $lte: "now()" }, members: { lookup_name: { name: { $eq: "webmaster" } } } },
      {
        orderBy: { started: "DESC" },
        populate: ["members", "members.lookup_name", "members.lookup_name.name"],
        populateWhere: PopulateHint.INFER,
      },
    );
    webmasters = committee?.members.toArray();
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
    let client: SMTPClient;
    try {
      client = new SMTPClient({
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
    } catch (e) {
      console.error("Failed to make SMTP client");
      console.error(`Tried to connect to ${env.EMAIL_HOST}:${env.EMAIL_PORT}`);
      throw error(
        500,
        `Sorry, we encountered a problem. Please email the webmaster directly at <a href="mailto:${webmaster.email}">${webmaster.email}</a> giving your name, email address and the names of the lists you wish to join, plus your reason for joining (if relevant).`,
      );
    }

    const emailPromise = new Promise((resolve, reject) =>
      client.send(
        new Message({
          from: `CUCB Website <${env["EMAIL_SEND_ADDRESS"]}>`,
          to: `CUCB Webmaster <${webmaster.email}>`,
          subject: `Request to join mailing lists`,
          // TODO move the Array(String).check earlier
          text: `${name}\n${email}\nWishes to join the following lists\n${Array(String)
            .check(JSON.parse(lists.toString()))
            .map((list) => `\t${list}`)
            .join(",\n")}`,
        }),
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
