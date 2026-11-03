// -------------------------------------------------------------------
// Mailer — sends real email when SMTP is configured, otherwise logs.
// -------------------------------------------------------------------
// Without SMTP_* env variables the mailer runs in "log mode": every
// message is printed to the server console so the flow stays testable
// in development. With SMTP set (e.g. Mailgun/Postmark/Gmail) it sends
// real email. All sends are best-effort: failures never crash a request.
// -------------------------------------------------------------------

const nodemailer = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const MAIL_FROM = process.env.MAIL_FROM || "SwiftTrack <no-reply@swifttrack.com>";

const transport = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

async function send(to, subject, text) {
  if (!transport) {
    console.log(`[mailer:log-mode] To: ${to} | Subject: ${subject}\n${text}\n`);
    return true;
  }
  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error(`[mailer] Failed to send to ${to}: ${err.message}`);
    return false;
  }
}

function fromSite() {
  return {
    brandName: process.env.BRAND_NAME || "SwiftTrack",
    supportPhone: process.env.SUPPORT_PHONE || "+1 (212) 555-0142",
  };
}

// --- Shared templates ------------------------------------------------
async function sendAdminAlert(subject, text) {
  return send(
    process.env.ADMIN_EMAIL || "admin@example.com",
    subject,
    text
  );
}

async function sendStatusUpdate(to, shipment, event, unsubscribeUrl) {
  const { brandName, supportPhone } = fromSite();
  return send(
    to,
    `[${shipment.trackingNumber}] Your parcel is now: ${event.status}`,
    [
      `Hello,`,
      ``,
      `There is an update on your parcel ${shipment.trackingNumber}:`,
      ``,
      `  Status:    ${event.status}`,
      `  Location:  ${event.location}`,
      `  Via:       ${shipment.origin} -> ${shipment.destination}`,
      `  Note:      ${event.description || "—"}`,
      ``,
      `Track it any time: /track/${shipment.trackingNumber}`,
      ``,
      `Questions? Call ${supportPhone}.`,
      ``,
      `To stop receiving updates, visit: ${unsubscribeUrl}`,
      ``,
      `— The ${brandName} team`,
    ].join("\n")
  );
}

module.exports = { send, sendAdminAlert, sendStatusUpdate };
