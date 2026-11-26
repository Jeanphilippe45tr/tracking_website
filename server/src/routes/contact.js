// -------------------------------------------------------------------
// Contact routes
// -------------------------------------------------------------------
// POST /api/contact  (public) - stores messages so the team can see them.
// -------------------------------------------------------------------

const express = require("express");
const { ContactMessage } = require("../models");
const { asyncHandler } = require("../utils/errors");
const { validate, assertValid } = require("../utils/validation");

const router = express.Router();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const errors = validate(req.body, {
      name: { required: true, minLength: 2, label: "Name" },
      email: { required: true, email: true, label: "Email" },
      subject: { required: true, minLength: 2, label: "Subject" },
      message: { required: true, minLength: 10, label: "Message" },
      trackingNumber: { maxLength: 40, label: "Tracking number" },
    });
    assertValid(errors);

    const contact = await ContactMessage.create({
      name: String(req.body.name).trim(),
      email: String(req.body.email).trim().toLowerCase(),
      subject: String(req.body.subject).trim(),
      message: String(req.body.message).trim(),
      trackingNumber: req.body.trackingNumber
        ? String(req.body.trackingNumber).trim().toUpperCase()
        : null,
    });

    res.status(201).json({ ok: true, id: contact.id });
  })
);

module.exports = router;
