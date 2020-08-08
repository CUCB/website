import { SMTPClient } from "emailjs";
import escapeHtml from "escape-html";
import fetch from "node-fetch";

export async function post(req, res, next) {
  const { name, email, bookingEnquiry, occasion, dates, times, venue, message } = req.body;
  // TODO error handling
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = `${protocol}://${req.headers.host}`;
  const committeeRes = await fetch(`${host}/committee.json`).then(r => r.json());
  const secretary = (committeeRes && committeeRes.committee.secretary) || {
    casual_name: "Secretary",
    email: "secretary@cucb.co.uk",
  };
  console.log(secretary);

  const client = new SMTPClient({
    host: "localhost",
    ssl: false,
  });

  const enquiryInformation = bookingEnquiry
    ? `Booking enquiry information:\n\tOccasion:\t${occasion}\n\tDates:\t\t${dates}\n\tTimes:\t\t${times}\n\tVenue:\t\t${venue}\n\n`
    : ``;

  client.send(
    {
      logger: {
        debug: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
      },
      from: `CUCB Online Contact Form <webmaster@cucb.co.uk>`,
      "reply-to": `${name.trim()} <${email.trim()}>`,
      to: `CUCB Secretary <${secretary.email}>`,
      subject: `${name} — Online Enquiry`,
      text: `Hello ${
        secretary.casual_name
      }!\n\nYou have been sent the following enquiry by ${name} (${email}).\n\n${enquiryInformation}Message:\n\n\n-----------------------\n\n${escapeHtml(
        message,
      )}\n\n-----------------------\n\nMany thanks!\n`,
    },
    (err, message) => {
      console.log(err || message);
    },
  );
  res.statusCode = 204;
  res.end();
}
