import { SMTPClient } from "emailjs";
import escapeHtml from "escape-html";
import fetch from "node-fetch";

export async function post(req, res, next) {
  const { name, email, bookingEnquiry, occasion, dates, times, venue, message } = req.body;
  // TODO error handling
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = `${protocol}://${req.headers.host}`;
  const committeeRes = await fetch(`${host}/committee.json`).then(r => r.json());
  const secretary = committeeRes && committeeRes.committee.filter(member => member.committee_key == "secretary");
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
      : ``;

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
    (err, message) => {
      // TODO process the error and feed back to the client
      console.log(err || message);
    },
  );
  res.statusCode = 204;
  res.end();
}
