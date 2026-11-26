const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Shipment = sequelize.define("Shipment", {
  trackingNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  senderName: DataTypes.STRING,
  receiverName: DataTypes.STRING,
  receiverPhone: DataTypes.STRING,
  origin: DataTypes.STRING,
  destination: DataTypes.STRING,
  weight: DataTypes.FLOAT,
  description: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: "Created" },
});

const ShipmentEvent = sequelize.define("ShipmentEvent", {
  status: DataTypes.STRING,
  location: DataTypes.STRING,
  description: DataTypes.STRING,
});

const RelayPoint = sequelize.define("RelayPoint", {
  name: DataTypes.STRING,
  address: DataTypes.STRING,
  city: DataTypes.STRING,
  postalCode: DataTypes.STRING,
  hours: DataTypes.STRING,
  distance: DataTypes.FLOAT,
});

const defaultPrefs = {
  defaultSpeed: 2,
  chatWelcome:
    "Hi! You are chatting with the SwiftTrack team. Tell us your tracking number and how we can help.",
  supportEmail: "support@swifttrack.com",
  notifyNewMessages: true,
  notifyStatusChanges: true,
};

const AdminUser = sequelize.define("AdminUser", {
  name: { type: DataTypes.STRING, defaultValue: "Admin" },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  phone: { type: DataTypes.STRING, defaultValue: "" },
  role: { type: DataTypes.STRING, defaultValue: "admin" },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  passwordChangedAt: DataTypes.DATE,
  prefs: { type: DataTypes.JSON },
});

Shipment.hasMany(ShipmentEvent, { as: "events", foreignKey: "shipmentId" });
ShipmentEvent.belongsTo(Shipment, { foreignKey: "shipmentId" });

module.exports = { Shipment, ShipmentEvent, RelayPoint, AdminUser, defaultPrefs };
