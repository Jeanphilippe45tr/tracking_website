const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");
const { SHIPMENT_STATUSES } = require("../config/constants");

class ShipmentEvent extends Model {}

ShipmentEvent.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    shipmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: {
        isIn: [SHIPMENT_STATUSES],
      },
    },
    location: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Coordinates resolved from the location text, used by the map.
    lat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "ShipmentEvent",
    tableName: "shipment_events",
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ["shipmentId"] }],
  }
);

module.exports = ShipmentEvent;
