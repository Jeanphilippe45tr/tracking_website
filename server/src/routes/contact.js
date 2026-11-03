const express = require("express");
const { ContactMessage } = require("../models");
const { EMAIL_RE } = require("../utils/helpers");
const { requireAuth } = require("../middleware/auth");
const mailer = require("../mailer");

const router = express.Router();

const SUBJECTS = ["tracking", "address", "customs", "relay", "quote", "other"];

const SUBJECT_LABELS = {
  tracking: "Tracking issue",
  address: "Address change",
  customs: "Customs",
  relay: "Relay point",
  quote: "Quote / pricing",
  other: "Other",
};

function serialize(msg) {
  const json = msg.toJSON();
  json.subjectLabel = SUBJECT_LABELS[json.subject] || json.subject;
  return json;
}

// --- GET /api/contact (ADMIN) — contact inbox ------------------------
router.get("/", requireAuth, async (req, res) => {
  try {
    const messages = await ContactMessage.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(messages.map(serialize));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PATCH /api/contact/:id/read (ADMIN) ------------------------------
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ error: "Message not found" });
    msg.read = true;
    await msg.save();
    res.json(serialize(msg));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DELETE /api/contact/:id (ADMIN) ----------------------------------
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await ContactMessage.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Message not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

    // Best-effort email to the staff address so messages are noticed
    // even before the admin inbox is checked.
    mailer.sendAdminAlert(
      `[${SUBJECT_LABELS[cleanSubject] || cleanSubject}] New contact message from ${String(name).trim()}`,
      [
        `From:    ${String(name).trim()} <${cleanEmail}>`,
        `Subject: ${SUBJECT_LABELS[cleanSubject] || cleanSubject}`,
        `Tracking: ${saved.trackingNumber || "—"}`,
        ``,
        body,
      ].join("\n")
    );

    res.status(201).json({ ok: true, id: saved.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
