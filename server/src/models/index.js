const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Shipment = sequelize.define("Shipment", {
  trackingNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  senderName: DataTypes.STRING,
  receiverName: DataTypes.STRING,
  origin: DataTypes.STRING,
  destination: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: "Created" },
});

const ShipmentEvent = sequelize.define("ShipmentEvent", {
  status: DataTypes.STRING,
  location: DataTypes.STRING,
  description: DataTypes.STRING,
});

Shipment.hasMany(ShipmentEvent, { as: "events", foreignKey: "shipmentId" });
ShipmentEvent.belongsTo(Shipment, { foreignKey: "shipmentId" });

module.exports = { Shipment, ShipmentEvent };