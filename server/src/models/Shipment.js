const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");
const { SHIPMENT_STATUSES } = require("../config/constants");

class Shipment extends Model {
  toJSON() {
    const values = { ...this.get() };
    values.weight = Number(values.weight) || 0;
    if (values.events) {
      values.events = values.events.map((event) =>
        typeof event.toJSON === "function" ? event.toJSON() : event
      );
    }
    return values;
  }
}

Shipment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    trackingNumber: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    senderName: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    receiverName: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    receiverPhone: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "",
    },
    origin: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    destination: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    // The full address is optional: a city name alone is enough for the
    // map. When the admin fills in street / region / postal code / country,
    // the server geocodes it and stores the coordinates below.
    originAddress: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
    },
    originRegion: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "",
    },
    originPostalCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "",
    },
    originCountry: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "",
    },
    originLat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    originLng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    destinationAddress: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
    },
    destinationRegion: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "",
    },
    destinationPostalCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "",
    },
    destinationCountry: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "",
    },
    destinationLat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    destinationLng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    // Optional delivery person assigned by the admin.
    deliveryPersonId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "Created",
      validate: {
        isIn: [SHIPMENT_STATUSES],
      },
    },
    createdById: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Shipment",
    tableName: "shipments",
    timestamps: true,
    indexes: [
      { fields: ["status"] },
      { fields: ["createdAt"] },
      { fields: ["deliveryPersonId"] },
    ],
  }
);

module.exports = Shipment;
