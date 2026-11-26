const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

class ContactMessage extends Model {}

ContactMessage.init(
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
    email: {
      type: DataTypes.STRING(190),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    trackingNumber: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "new",
      validate: {
        isIn: [["new", "read", "replied", "archived"]],
      },
    },
  },
  {
    sequelize,
    modelName: "ContactMessage",
    tableName: "contact_messages",
    timestamps: true,
    indexes: [{ fields: ["status"] }, { fields: ["createdAt"] }],
  }
);

module.exports = ContactMessage;
