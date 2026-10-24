const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// -------------------------------------------------------------------
// Shipment + timeline events
// -------------------------------------------------------------------

const Shipment = sequelize.define(
  "Shipment",
  {
    trackingNumber: {
      type: DataTypes.STRING(12),
      unique: true,
      allowNull: false,
    },
    senderName: { type: DataTypes.STRING, allowNull: false },
    receiverName: { type: DataTypes.STRING, allowNull: false },
    receiverPhone: { type: DataTypes.STRING, allowNull: false },
    origin: { type: DataTypes.STRING, allowNull: false },
    destination: { type: DataTypes.STRING, allowNull: false },
    weight: { type: DataTypes.FLOAT, allowNull: false },
    description: { type: DataTypes.STRING, defaultValue: "" },
    status: { type: DataTypes.STRING, defaultValue: "Created" },
    // Service level: "express" or "standard"
    serviceLevel: { type: DataTypes.STRING, defaultValue: "standard" },
    // Optional enrichment (admin-editable). The tracking page shows the
    // real carrier when set instead of its demo placeholder.
    carrier: { type: DataTypes.STRING, allowNull: true },
    cost: { type: DataTypes.FLOAT, allowNull: true },
    scheduledDeliveryAt: { type: DataTypes.DATE, allowNull: true },
  },
  { underscored: false }
);

const ShipmentEvent = sequelize.define("ShipmentEvent", {
  status: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, defaultValue: "" },
  // Audit: which admin recorded this scan (name only).
  createdBy: { type: DataTypes.STRING, allowNull: true },
});

Shipment.hasMany(ShipmentEvent, { as: "events", foreignKey: "shipmentId" });
ShipmentEvent.belongsTo(Shipment, { foreignKey: "shipmentId" });

// -------------------------------------------------------------------
// Admin account (single admin user) + preferences
// -------------------------------------------------------------------

const AdminUser = sequelize.define("AdminUser", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  phone: { type: DataTypes.STRING, defaultValue: "" },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: "admin" },
  passwordChangedAt: { type: DataTypes.DATE, allowNull: true },
  // Bumped on every password change; tokens embed the version so old
  // sessions die immediately.
  tokenVersion: { type: DataTypes.INTEGER, defaultValue: 0 },
  prefs: {
    // { chatWelcome, supportEmail, notifyNewMessages, notifyStatusChanges, defaultSpeed }
    type: DataTypes.JSON,
    allowNull: true,
  },
});

// -------------------------------------------------------------------
// Relay points (public pickup locations)
// -------------------------------------------------------------------

const RelayPoint = sequelize.define("RelayPoint", {
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
  postalCode: { type: DataTypes.STRING, allowNull: false },
  hours: { type: DataTypes.STRING, allowNull: true },
  distance: { type: DataTypes.FLOAT, allowNull: true },
  // Accent-lower-cased copies, used by the search to make the query
  // accent- and case-insensitive ("São Paulo" finds "Sao Paulo").
  searchName: { type: DataTypes.STRING, allowNull: false },
  searchAddress: { type: DataTypes.STRING, allowNull: false },
  searchCity: { type: DataTypes.STRING, allowNull: false },
  searchPostal: { type: DataTypes.STRING, allowNull: false },
});

// -------------------------------------------------------------------
// Chat: conversations (one per website visitor) + messages
// -------------------------------------------------------------------

const Conversation = sequelize.define(
  "Conversation",
  {
    visitorId: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, defaultValue: "Website visitor" },
    email: { type: DataTypes.STRING, defaultValue: "" },
    subject: { type: DataTypes.STRING, defaultValue: "Website chat" },
  },
  { timestamps: true }
);

const Message = sequelize.define("Message", {
  conversationId: { type: DataTypes.INTEGER, allowNull: false },
  from: { type: DataTypes.STRING, allowNull: false }, // "customer" | "admin"
  text: { type: DataTypes.TEXT, allowNull: false },
  readByAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  readByCustomer: { type: DataTypes.BOOLEAN, defaultValue: false },
});

Conversation.hasMany(Message, { as: "messages", foreignKey: "conversationId" });
Message.belongsTo(Conversation, { foreignKey: "conversationId" });

// -------------------------------------------------------------------
// Contact form submissions
// -------------------------------------------------------------------

const ContactMessage = sequelize.define("ContactMessage", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  subject: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  trackingNumber: { type: DataTypes.STRING, allowNull: true },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// -------------------------------------------------------------------
// Status-update subscriptions ("Notify me about this parcel")
// -------------------------------------------------------------------

const Subscription = sequelize.define("Subscription", {
  shipmentId: { type: DataTypes.INTEGER, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  unsubscribeToken: { type: DataTypes.STRING, unique: true, allowNull: false },
});

// -------------------------------------------------------------------
// Newsletter subscribers
// -------------------------------------------------------------------

const NewsletterSubscriber = sequelize.define("NewsletterSubscriber", {
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
});

// -------------------------------------------------------------------
// Live-tracking simulation session (a single global run)
// -------------------------------------------------------------------

const LiveSession = sequelize.define(
  "LiveSession",
  {
    // Singleton row (id = 1). We upsert into it.
    id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
    status: { type: DataTypes.STRING, defaultValue: "idle" }, // idle|running|paused|stopped|completed
    trackNumber: { type: DataTypes.STRING, allowNull: true },
    shipmentId: { type: DataTypes.INTEGER, allowNull: true },
    origin: { type: DataTypes.STRING, defaultValue: "" },
    destination: { type: DataTypes.STRING, defaultValue: "" },
    // Polyline origin -> destination, used by the map widgets.
    route: { type: DataTypes.JSON, defaultValue: [] },
    progress: { type: DataTypes.FLOAT, defaultValue: 0 }, // 0..1
    // Progress computation base: progress at baseAt + elapsed * speed / BASE
    baseProgress: { type: DataTypes.FLOAT, defaultValue: 0 },
    baseAt: { type: DataTypes.DATE, allowNull: true },
    speed: { type: DataTypes.FLOAT, defaultValue: 2 },
    startedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { timestamps: true, updatedAt: "updatedAt" }
);

// -------------------------------------------------------------------
// Site settings (singleton) — brand/contact details editable by the
// admin in the platform Settings page. Consumed publicly by the site.
// -------------------------------------------------------------------

const SiteSetting = sequelize.define(
  "SiteSetting",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
    brandName: { type: DataTypes.STRING, allowNull: false },
    supportEmail: { type: DataTypes.STRING, allowNull: false },
    supportPhone: { type: DataTypes.STRING, allowNull: false },
    whatsappNumber: { type: DataTypes.STRING, allowNull: false },
    chatWelcome: { type: DataTypes.TEXT, allowNull: false },
  },
  { timestamps: true, createdAt: false, updatedAt: "updatedAt" }
);

// -------------------------------------------------------------------
// Exports
// -------------------------------------------------------------------

module.exports = {
  sequelize,
  Shipment,
  ShipmentEvent,
  AdminUser,
  RelayPoint,
  Conversation,
  Message,
  ContactMessage,
  Subscription,
  NewsletterSubscriber,
  LiveSession,
  SiteSetting,
};
