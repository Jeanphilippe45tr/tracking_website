const express = require("express");
const { Conversation, Message } = require("../models");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function serializeMessage(message) {
  return {
    id: message.id,
    from: message.from,
    text: message.text,
    at: message.createdAt,
    readByAdmin: message.readByAdmin,
    readByCustomer: message.readByCustomer,
  };
}

function serializeConversation(conversation) {
  const messages = (conversation.messages || [])
    .map(serializeMessage)
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  return {
    id: conversation.id,
    visitorId: conversation.visitorId,
    name: conversation.name,
    email: conversation.email,
    subject: conversation.subject,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    unreadForAdmin: messages.filter(
      (m) => m.from === "customer" && !m.readByAdmin
    ).length,
    unreadForCustomer: messages.filter(
      (m) => m.from === "admin" && !m.readByCustomer
    ).length,
    messages,
    lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
  };
}

async function loadConversation(id) {
  return Conversation.findByPk(id, {
    include: { model: Message, as: "messages" },
  });
}

// -------------------------------------------------------------------
// PUBLIC (visitor) endpoints
// -------------------------------------------------------------------

// --- POST /api/chat/conversations {visitorId, name?, email?, text} --
// Creates the conversation on the first message, or reuses the existing
// one and appends the message. Gets/updates the visitor's name/email.
router.post("/conversations", async (req, res) => {
  try {
    const { visitorId, name, email, text } = req.body ?? {};

    if (!String(visitorId ?? "").trim()) {
      return res.status(400).json({ error: "A visitor id is required." });
    }
    const body = String(text ?? "").trim();
    if (!body) {
      return res.status(400).json({ error: "The message cannot be empty." });
    }

    let conversation = await Conversation.findOne({
      where: { visitorId: String(visitorId).trim() },
    });

    if (conversation) {
      // Keep the freshest contact details on the conversation.
      conversation.name = String(name ?? "").trim() || conversation.name;
      conversation.email = String(email ?? "").trim() || conversation.email;
      await conversation.save();
    } else {
      conversation = await Conversation.create({
        visitorId: String(visitorId).trim(),
        name: String(name ?? "").trim() || "Website visitor",
        email: String(email ?? "").trim(),
        subject: "Website chat",
      });
    }

    await Message.create({
      conversationId: conversation.id,
      from: "customer",
      text: body,
      readByAdmin: false,
      readByCustomer: true,
    });

    const fresh = await loadConversation(conversation.id);
    res.status(201).json(serializeConversation(fresh));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PATCH /api/chat/conversations/visitor/read ---------------------
// The visitor opened the chat panel → admin replies are "read".
router.patch("/conversations/visitor/read", async (req, res) => {
  try {
    const { visitorId } = req.body ?? {};
    if (!String(visitorId ?? "").trim()) {
      return res.status(400).json({ error: "A visitor id is required." });
    }
    await Message.update(
      { readByCustomer: true },
      {
        where: {
          from: "admin",
          readByCustomer: false,
          conversationId: (
            await Conversation.findAll({
              where: { visitorId: String(visitorId).trim() },
              attributes: ["id"],
            })
          ).map((c) => c.id),
        },
      }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------
// ADMIN endpoints (Bearer token)
// -------------------------------------------------------------------

// --- GET /api/chat/conversations — inbox, newest activity first ------
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const rows = await Conversation.findAll({
      include: { model: Message, as: "messages" },
      order: [["updatedAt", "DESC"]],
    });
    const conversations = rows
      .map(serializeConversation)
      // updatedAt DESC: newest message/updatedAt first.
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const unreadTotal = conversations.reduce(
      (sum, c) => sum + c.unreadForAdmin,
      0
    );
    res.json({ conversations, unreadForAdmin: unreadTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PATCH /api/chat/conversations/read-all — clear every badge ------
router.patch("/conversations/read-all", requireAuth, async (req, res) => {
  try {
    await Message.update(
      { readByAdmin: true },
      { where: { from: "customer", readByAdmin: false } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/chat/conversations/:id — one full thread ----------------
router.get("/conversations/:id", requireAuth, async (req, res) => {
  try {
    const conversation = await loadConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json(serializeConversation(conversation));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/chat/conversations/:id/messages {text} — admin reply ---
router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const body = String(req.body?.text ?? "").trim();
    if (!body) {
      return res.status(400).json({ error: "The message cannot be empty." });
    }

    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    await Message.create({
      conversationId: conversation.id,
      from: "admin",
      text: body,
      readByAdmin: true,
      readByCustomer: false,
    });

    const fresh = await loadConversation(req.params.id);
    res.status(201).json(serializeConversation(fresh));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PATCH /api/chat/conversations/:id/read — admin opened the thread
router.patch("/conversations/:id/read", requireAuth, async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    await Message.update(
      { readByAdmin: true },
      {
        where: {
          conversationId: conversation.id,
          from: "customer",
          readByAdmin: false,
        },
      }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DELETE /api/chat/conversations/:id ------------------------------
router.delete("/conversations/:id", requireAuth, async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    await Message.destroy({ where: { conversationId: conversation.id } });
    await conversation.destroy();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DELETE /api/chat/conversations — delete ALL conversations ------
router.delete("/conversations", requireAuth, async (req, res) => {
  try {
    await Message.destroy({ where: {} });
    await Conversation.destroy({ where: {} });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
