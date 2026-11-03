// -------------------------------------------------------------------
// "Notify me" subscriptions + newsletter (Tier-4 + Tier-5 items)
// -------------------------------------------------------------------

const express = require("express");
const crypto = require("crypto");
const { Shipment, Subscription, NewsletterSubscriber } = require("../models");
const { EMAIL_RE } = require("../utils/helpers");
const mailer = require("../mailer");

const router = express.Router();

// Simple in-memory throttle for the unsubscribe GET link.
const seenUnsubscribe = new Set();

// --- POST /api/notifications/subscribe (PUBLIC) ----------------------
// Body: { trackingNumber, email }
router.post("/subscribe", async (req, res) => {
  try {
    const trackingNumber = String(req.body?.trackingNumber ?? "").trim();
    const email = String(req.body?.email ?? "").trim();

    if (!trackingNumber) {
      return res.status(400).json({ error: "Please give a tracking number." });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const shipment = await Shipment.findOne({
      where: { trackingNumber },
    });
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    if (shipment.status === "Delivered") {
      return res.status(400).json({
        error: "This parcel is already delivered — no updates to send.",
      });
    }

    const [sub, created] = await Subscription.findOrCreate({
      where: { shipmentId: shipment.id, email },
      defaults: {
        active: true,
        unsubscribeToken: crypto.randomBytes(16).toString("hex"),
      },
    });
    if (!sub.active) {
      sub.active = true;
      await sub.save();
    }

    if (created) {
      const { brandName } = { brandName: process.env.BRAND_NAME || "SwiftTrack" };
      mailer.send(
        email,
        `You will get updates for ${trackingNumber}`,
        [
          `Hello,`,
          ``,
          `You subscribed to email updates for parcel ${trackingNumber}`,
          `(${shipment.origin} -> ${shipment.destination}).`,
          ``,
          `We will email you whenever its status changes`,
          `(currently: ${shipment.status}).`,
          ``,
          `Thank you for using ${brandName}.`,
        ].join("\n")
      );
    }

    res.status(created ? 201 : 200).json({
      ok: true,
      already: !created,
      message: created
        ? "You will receive email updates about this parcel."
        : "This email is already subscribed to this parcel.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/notifications/unsubscribe (PUBLIC) — email-link flow ---
// Body/query: ?token=<unsubscribeToken>
router.get("/unsubscribe", (req, res) => {
  const token = String(req.query.token ?? "").trim();
  if (!token || seenUnsubscribe.has(token)) {
    res.set("Content-Type", "text/html");
    return res.send(
      "<h3>Unsubscribe</h3><p>This link is no longer valid.</p>"
    );
  }
  seenUnsubscribe.add(token);
  Subscription.findOne({ where: { unsubscribeToken: token } }).then((sub) => {
    if (sub) {
      sub.active = false;
      return sub.save();
    }
    return null;
  }).then((sub) => {
    res.set("Content-Type", "text/html");
    res.send(
      sub
        ? `<h3>Unsubscribed</h3><p>You will no longer receive updates for this parcel.</p>`
        : `<h3>Unsubscribe</h3><p>This link is no longer valid.</p>`
    );
  }).catch(() => {
    res.set("Content-Type", "text/html");
    res.send("<h3>Unsubscribe</h3><p>Something went wrong. Try again later.</p>");
  });
});

// --- POST /api/newsletter (PUBLIC) — footer signup -------------------
router.post("/newsletter", async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").trim();
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    const [sub, created] = await NewsletterSubscriber.findOrCreate({
      where: { email },
    });
    res.status(created ? 201 : 200).json({
      ok: true,
      message: created
        ? "Subscribed! Welcome aboard."
        : "You are already on the list.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
