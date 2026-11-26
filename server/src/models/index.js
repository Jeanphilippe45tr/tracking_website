// -------------------------------------------------------------------
// Model registry + associations
// -------------------------------------------------------------------

const sequelize = require("../db");
const User = require("./User");
const Courier = require("./Courier");
const Shipment = require("./Shipment");
const ShipmentEvent = require("./ShipmentEvent");
const RelayPoint = require("./RelayPoint");
const Conversation = require("./Conversation");
const Message = require("./Message");
const ContactMessage = require("./ContactMessage");
const LiveRun = require("./LiveRun");

// Admin who registered a shipment (kept nullable so deleting an admin
// never deletes shipment history).
User.hasMany(Shipment, {
  as: "shipments",
  foreignKey: "createdById",
  onDelete: "SET NULL",
});
Shipment.belongsTo(User, { as: "createdBy", foreignKey: "createdById" });

// Optional delivery person assigned to a parcel.
Courier.hasMany(Shipment, {
  as: "shipments",
  foreignKey: "deliveryPersonId",
  onDelete: "SET NULL",
});
Shipment.belongsTo(Courier, {
  as: "deliveryPerson",
  foreignKey: "deliveryPersonId",
});

Shipment.hasMany(ShipmentEvent, {
  as: "events",
  foreignKey: "shipmentId",
  onDelete: "CASCADE",
  hooks: true,
});
ShipmentEvent.belongsTo(Shipment, { foreignKey: "shipmentId" });

// A shipment can have several simulation runs over time (and the admin can
// run routes for different shipments at the same time).
Shipment.hasMany(LiveRun, {
  as: "liveRuns",
  foreignKey: "shipmentId",
  onDelete: "SET NULL",
});
LiveRun.belongsTo(Shipment, { as: "shipment", foreignKey: "shipmentId" });

Conversation.hasMany(Message, {
  as: "messages",
  foreignKey: "conversationId",
  onDelete: "CASCADE",
  hooks: true,
});
Message.belongsTo(Conversation, { foreignKey: "conversationId" });

// -------------------------------------------------------------------
// Lightweight auto-migration
// -------------------------------------------------------------------
// sequelize.sync() creates missing tables but does not add new columns to
// existing ones. This walks the models and adds any column that is missing,
// which lets an existing local/staging database pick up new fields (street
// address, coordinates, courier id, ...) without dropping data.
async function addMissingColumns() {
  const queryInterface = sequelize.getQueryInterface();

  for (const model of Object.values(sequelize.models)) {
    if (!model.tableName) continue;

    let existing;
    try {
      existing = await queryInterface.describeTable(model.tableName);
    } catch {
      // Table does not exist yet (sync will create it next run).
      continue;
    }

    for (const [name, attribute] of Object.entries(model.rawAttributes)) {
      if (existing[name]) continue;
      if (attribute.primaryKey) continue;
      if (attribute.type?.key === "VIRTUAL") continue;

      const definition = {
        type: attribute.type,
        allowNull: attribute.allowNull !== false,
      };
      if (attribute.defaultValue !== undefined) {
        definition.defaultValue = attribute.defaultValue;
      }
      // Adding a required column without a default would fail on populated
      // tables; leave it nullable in that unusual case.
      if (!definition.allowNull && definition.defaultValue === undefined) {
        definition.allowNull = true;
      }
      if (attribute.references) {
        definition.references = attribute.references;
        definition.onDelete = attribute.onDelete;
        definition.onUpdate = attribute.onUpdate;
      }

      try {
        await queryInterface.addColumn(model.tableName, name, definition);
        console.log(`[db] Added missing column ${model.tableName}.${name}`);
      } catch (err) {
        console.warn(
          `[db] Could not add ${model.tableName}.${name}: ${err.message}`
        );
      }
    }
  }
}

async function syncModels(options = {}) {
  // Add columns to existing tables *before* sync() tries to create indexes
  // that reference them. New tables are skipped (describeTable throws) and
  // are then created by sync() with all their columns and indexes.
  if (!options.force) await addMissingColumns();

  const result = await sequelize.sync(options);
  return result;
}

module.exports = {
  sequelize,
  User,
  Courier,
  Shipment,
  ShipmentEvent,
  RelayPoint,
  Conversation,
  Message,
  ContactMessage,
  LiveRun,
  syncModels,
  addMissingColumns,
};
