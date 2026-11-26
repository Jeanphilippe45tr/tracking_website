const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

class RelayPoint extends Model {}

RelayPoint.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    region: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "",
    },
    country: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "",
    },
    postalCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "",
    },
    hours: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "",
    },
    distance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "RelayPoint",
    tableName: "relay_points",
    timestamps: true,
    indexes: [{ fields: ["city"] }, { fields: ["postalCode"] }],
  }
);

module.exports = RelayPoint;
