const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

// A delivery person the admin can assign to shipments. They do not need
// a login account - this is just a staff record for the public tracking
// page and the admin dashboard.
class Courier extends Model {}

Courier.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "",
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      defaultValue: "",
    },
    vehicle: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Courier",
    tableName: "couriers",
    timestamps: true,
    indexes: [{ fields: ["isActive"] }],
  }
);

module.exports = Courier;
