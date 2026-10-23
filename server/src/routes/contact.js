const express = require("express");
const { ContactMessage } = require("../models");
const { EMAIL_RE } = require("../utils/helpers");

const router = express.Router();

const SUBJECTS = ["tracking", "address", "customs", "relay", "quote", "other"];

// --- POST /api/contact (PUBLIC) — store a contact form submission ----
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message, trackingNumber } = req.body ?? {};

    const errors = [];
    if (!String(name ?? "").trim()) errors.push("Your name is required.");
    const cleanEmail = String(email ?? "").trim();
    if (!cleanEmail) errors.push("Your email is required.");
    else if (!EMAIL_RE.test(cleanEmail)) {
      errors.push("Enter a valid email address.");
    }
    const cleanSubject = String(subject ?? "").trim();
    if (!cleanSubject) errors.push("A subject is required.");
    else if (!SUBJECTS.includes(cleanSubject)) {
      errors.push("Choose a valid subject.");
    }
    const body = String(message ?? "").trim();
    if (!body) errors.push("Please write a message.");
    else if (body.length < 10) {
      errors.push("Your message should be at least 10 characters.");
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(" ") });
    }

    const saved = await ContactMessage.create({
      name: String(name).trim(),
      email: cleanEmail,
      subject: cleanSubject,
      message: body,
      trackingNumber: String(trackingNumber ?? "").trim() || null,
    });

    res.status(201).json({ ok: true, id: saved.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
