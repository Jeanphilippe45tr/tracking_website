const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

class Conversation extends Model {
  toJSON() {
    const values = { ...this.get() };
    values.name = values.visitorName;
    values.email = values.visitorEmail;
    // The frontend uses `updatedAt` to sort the inbox and show "updated
    // X minutes ago", so prefer the last message time when we have one.
    values.updatedAt = values.lastMessageAt || values.updatedAt;
    delete values.visitorName;
    delete values.visitorEmail;
    if (values.messages) {
      values.messages = values.messages.map((message) =>
        typeof message.toJSON === "function" ? message.toJSON() : message
      );
    }
    return values;
  }
}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    visitorId: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    visitorName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "Website visitor",
    },
    visitorEmail: {
      type: DataTypes.STRING(190),
      allowNull: false,
      defaultValue: "",
    },
    subject: {
      type: DataTypes.STRING(160),
      allowNull: false,
      defaultValue: "Website chat",
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Conversation",
    tableName: "conversations",
    timestamps: true,
    indexes: [{ fields: ["lastMessageAt"] }],
  }
);

module.exports = Conversation;
