const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");
const { RELATIONSHIP } = require("../config/constants");

class Message extends Model {
  // Map internal column names to the API contract used by the chat UI.
  toJSON() {
    const values = { ...this.get() };
    return {
      id: values.id,
      conversationId: values.conversationId,
      from: values.sender,
      text: values.body,
      at: values.createdAt,
      readByAdmin: Boolean(values.readByAdmin),
      readByCustomer: Boolean(values.readByCustomer),
    };
  }
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sender: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [[RELATIONSHIP.CUSTOMER, RELATIONSHIP.ADMIN]],
      },
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    readByAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readByCustomer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Message",
    tableName: "messages",
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ["conversationId"] }],
  }
);

module.exports = Message;
