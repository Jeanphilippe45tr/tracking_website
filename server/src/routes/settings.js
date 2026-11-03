const express = require("express");
const { SiteSetting } = require("../models");
const { requireAuth } = require("../middleware/auth");
const { EMAIL_RE } = require("../utils/helpers");

const router = express.Router();

// Built-in defaults (seeded into the singleton row on first boot).
function defaults() {
  return {
    brandName: process.env.BRAND_NAME || "SwiftTrack",
    supportEmail: process.env.SUPPORT_EMAIL || "support@swifttrack.com",
    supportPhone: process.env.SUPPORT_PHONE || "+1 (212) 555-0142",
    whatsappNumber: process.env.WHATSAPP_NUMBER || "+12125550142",
    chatWelcome:
      "Hi! You are chatting with the SwiftTrack team. Tell us your tracking number and how we can help — a human replies here in a few minutes.",
  };
}

async function getRow() {
  let row = await SiteSetting.findByPk(1);
  if (!row) {
    row = await SiteSetting.create({ id: 1, ...defaults() });
  }
  return row;
}

function serialize(row) {
  return {
    brandName: row.brandName,
    supportEmail: row.supportEmail,
    supportPhone: row.supportPhone,
    whatsappNumber: row.whatsappNumber,
    chatWelcome: row.chatWelcome,
    updatedAt: row.updatedAt,
  };
}

// --- GET /api/settings (PUBLIC) -------------------------------------
router.get("/", async (req, res) => {
  try {
    res.json(serialize(await getRow()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PATCH /api/settings (ADMIN) — brand/contact editing ------------
router.patch("/", requireAuth, async (req, res) => {
  try {
    const row = await getRow();
    const { brandName, supportEmail, supportPhone, whatsappNumber, chatWelcome } =
      req.body ?? {};

    if (brandName !== undefined) {
      if (!String(brandName).trim()) {
        return res.status(400).json({ error: "The brand name is required." });
      }
      row.brandName = String(brandName).trim();
    }
    if (supportEmail !== undefined) {
      const email = String(supportEmail).trim();
      if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ error: "Enter a valid support email." });
      }
      row.supportEmail = email;
    }
    if (supportPhone !== undefined) {
      const phone = String(supportPhone).trim();
      if (!/^[0-9+()\-\s]{6,25}$/.test(phone)) {
        return res.status(400).json({ error: "Enter a valid phone number." });
      }
      row.supportPhone = phone;
    }
    if (whatsappNumber !== undefined) {
      const digits = String(whatsappNumber).replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 15) {
        return res.status(400).json({
          error: "The WhatsApp number needs 8 to 15 digits, country code first.",
        });
      }
      row.whatsappNumber = `+${digits}`;
    }
    if (chatWelcome !== undefined) {
      if (!String(chatWelcome).trim()) {
        return res
          .status(400)
          .json({ error: "The welcome message cannot be empty." });
      }
      row.chatWelcome = String(chatWelcome).trim();
    }

    await row.save();
    res.json(serialize(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
