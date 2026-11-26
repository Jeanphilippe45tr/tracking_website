// -------------------------------------------------------------------
// Chat routes
// -------------------------------------------------------------------
// Mirrors the frontend's chat store contract so the app can work with
// a real backend if desired:
//   GET    /api/chat/conversations        (admin)
//   POST   /api/chat/conversations        (visitor start)
//   GET    /api/chat/visitor/:visitorId  (visitor fetch)
//   POST   /api/chat/conversations/:id/messages (admin reply)
//   POST   /api/chat/visitor/:visitorId/messages (visitor send)
//   POST   /api/chat/conversations/:id/read (mark read by admin)
//   POST   /api/chat/visitor/:visitorId/read (mark read by customer)
//   DELETE /api/chat/conversations/:id    (admin delete)
// -------------------------------------------------------------------

const express = require("express");
const { Op } = require("sequelize");
const { Conversation, Message } = require("../models");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { asyncHandler, badRequest, notFound } = require("../utils/errors");
const { validate, assertValid } = require("../utils/validation");
const { RELATIONSHIP } = require("../config/constants");

const router = express.Router();

function toConversationJSON(conversation) {
  if (!conversation) return null;
  if (typeof conversation.toJSON === "function") return conversation.toJSON();
  return conversation;
}

async function loadConversationWithMessages(conversationId) {
  const conversation = await Conversation.findByPk(conversationId, {
    include: [{ model: Message, as: "messages" }],
    order: [[{ model: Message, as: "messages" }, "createdAt", "ASC"]],
  });
  return conversation;
}

// GET /api/chat/conversations - admin inbox
router.get(
  "/conversations",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const conversations = await Conversation.findAll({
      include: [{ model: Message, as: "messages" }],
      order: [
        ["lastMessageAt", "DESC"],
        ["updatedAt", "DESC"],
        [{ model: Message, as: "messages" }, "createdAt", "ASC"],
      ],
    });
    res.json(conversations.map(toConversationJSON));
  })
);

// POST /api/chat/conversations - visitor start / get conversation
router.post(
  "/conversations",
  asyncHandler(async (req, res) => {
    const { visitorId, name, email } = req.body || {};
    if (!visitorId) throw badRequest("visitorId is required.");

    const visitorName = String(name || "").trim() || "Website visitor";
    const visitorEmail = String(email || "").trim().toLowerCase();

    let conversation = await Conversation.findOne({
      where: { visitorId: String(visitorId) },
      include: [{ model: Message, as: "messages" }],
      order: [[{ model: Message, as: "messages" }, "createdAt", "ASC"]],
    });

    if (!conversation) {
      conversation = await Conversation.create({
        visitorId: String(visitorId),
        visitorName,
        visitorEmail,
        subject: "Website chat",
      });
      conversation = await loadConversationWithMessages(conversation.id);
    } else {
      if (name) conversation.visitorName = visitorName;
      if (email) conversation.visitorEmail = visitorEmail;
      await conversation.save();
      conversation = await loadConversationWithMessages(conversation.id);
    }

    res.json(toConversationJSON(conversation));
  })
);

// GET /api/chat/visitor/:visitorId
router.get(
  "/visitor/:visitorId",
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({
      where: { visitorId: String(req.params.visitorId) },
      include: [{ model: Message, as: "messages" }],
      order: [[{ model: Message, as: "messages" }, "createdAt", "ASC"]],
    });
    res.json(toConversationJSON(conversation));
  })
);

// POST /api/chat/visitor/:visitorId/messages
router.post(
  "/visitor/:visitorId/messages",
  asyncHandler(async (req, res) => {
    const errors = validate(req.body, {
      text: { required: true, minLength: 1, label: "Message" },
    });
    assertValid(errors);

    const visitorId = String(req.params.visitorId);
    const body = String(req.body.text).trim();

    let conversation = await Conversation.findOne({ where: { visitorId } });
    if (!conversation) {
      const visitorName = String(req.body.name || "").trim() || "Website visitor";
      const visitorEmail = String(req.body.email || "").trim().toLowerCase();
      conversation = await Conversation.create({
        visitorId,
        visitorName,
        visitorEmail,
        subject: "Website chat",
        lastMessageAt: new Date(),
      });
    } else {
      if (req.body.name) conversation.visitorName = String(req.body.name).trim();
      if (req.body.email)
        conversation.visitorEmail = String(req.body.email).trim().toLowerCase();
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    const message = await Message.create({
      conversationId: conversation.id,
      sender: RELATIONSHIP.CUSTOMER,
      body,
      readByAdmin: false,
      readByCustomer: true,
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const updated = await loadConversationWithMessages(conversation.id);
    res.status(201).json(toConversationJSON(updated));
  })
);

// POST /api/chat/conversations/:id/messages
router.post(
  "/conversations/:id/messages",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const errors = validate(req.body, {
      text: { required: true, minLength: 1, label: "Message" },
    });
    assertValid(errors);

    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) throw notFound("Conversation not found");

    await Message.create({
      conversationId: conversation.id,
      sender: RELATIONSHIP.ADMIN,
      body: String(req.body.text).trim(),
      readByAdmin: true,
      readByCustomer: false,
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const updated = await loadConversationWithMessages(conversation.id);
    res.status(201).json(toConversationJSON(updated));
  })
);

// POST /api/chat/conversations/:id/read
router.post(
  "/conversations/read-all",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await Message.update(
      { readByAdmin: true },
      { where: { sender: RELATIONSHIP.CUSTOMER, readByAdmin: false } }
    );
    res.json({ ok: true });
  })
);

// DELETE /api/chat/conversations
router.delete(
  "/conversations",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await Conversation.destroy({ where: {}, truncate: false });
    res.json({ ok: true });
  })
);

// POST /api/chat/conversations/:id/read
router.post(
  "/conversations/:id/read",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) throw notFound("Conversation not found");
    await Message.update(
      { readByAdmin: true },
      { where: { conversationId: conversation.id, sender: RELATIONSHIP.CUSTOMER, readByAdmin: false } }
    );
    res.json({ ok: true });
  })
);

// POST /api/chat/visitor/:visitorId/read
router.post(
  "/visitor/:visitorId/read",
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({
      where: { visitorId: String(req.params.visitorId) },
    });
    if (!conversation) return res.json({ ok: true });
    await Message.update(
      { readByCustomer: true },
      { where: { conversationId: conversation.id, sender: RELATIONSHIP.ADMIN, readByCustomer: false } }
    );
    res.json({ ok: true });
  })
);

// DELETE /api/chat/conversations/:id
router.delete(
  "/conversations/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) throw notFound("Conversation not found");
    await conversation.destroy();
    res.json({ ok: true });
  })
);

module.exports = router;
