// -------------------------------------------------------------------
// ensureSchema — lightweight migrations for columns added *after* a
// table already exists. sequelize.sync() creates missing tables but
// never alters existing ones, which is exactly what bit us in
// production: the tables exist (created earlier) while newer columns
// (tokenVersion, shipment coords, …) are missing.
// -------------------------------------------------------------------
// This walks a list of "model.column" additions and adds whichever are
// missing, using queryInterface so it works on Postgres, MySQL and
// SQLite alike. Missing tables are handled by sync(); this only adds
// columns. New since charcoal-v1; reruns are silent no-ops.
// -------------------------------------------------------------------

const { DataTypes } = require("sequelize");
const {
  sequelize,
  AdminUser,
  Shipment,
  ShipmentEvent,
  ContactMessage,
  LiveSession,
} = require("./models");

const COLUMN_ADDITIONS = [
  [AdminUser, "tokenVersion", { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }],
  // Shipment enrichment (service level, carrier, cost, delivery date)
  [Shipment, "serviceLevel", { type: DataTypes.STRING, defaultValue: "standard" }],
  [Shipment, "carrier", { type: DataTypes.STRING, allowNull: true }],
  [Shipment, "cost", { type: DataTypes.FLOAT, allowNull: true }],
  [Shipment, "scheduledDeliveryAt", { type: DataTypes.DATE, allowNull: true }],
  // Precise geocoded coordinates for exact map plotting
  [Shipment, "originLat", { type: DataTypes.FLOAT, allowNull: true }],
  [Shipment, "originLng", { type: DataTypes.FLOAT, allowNull: true }],
  [Shipment, "destinationLat", { type: DataTypes.FLOAT, allowNull: true }],
  [Shipment, "destinationLng", { type: DataTypes.FLOAT, allowNull: true }],
  // Audit: who recorded a tracking event
  [ShipmentEvent, "createdBy", { type: DataTypes.STRING, allowNull: true }],
  // Contact inbox read flag
  [ContactMessage, "read", { type: DataTypes.BOOLEAN, defaultValue: false }],
  // Live simulation extras (route length + suggested speed)
  [LiveSession, "distanceKm", { type: DataTypes.FLOAT, defaultValue: 0 }],
  [LiveSession, "suggestedSpeed", { type: DataTypes.FLOAT, defaultValue: 0 }],
];

async function ensureSchema() {
  const queryInterface = sequelize.getQueryInterface();

  for (const [model, column, definition] of COLUMN_ADDITIONS) {
    const table = model.getTableName();
    try {
      await queryInterface.addColumn(table, column, definition);
      console.log(`[migrate] added ${table}.${column}`);
    } catch (err) {
      // "column already exists" on a rerun is expected and silent.
      if (/exists|duplicate/i.test(err.message)) continue;
      console.error(`[migrate] ${table}.${column}: ${err.message}`);
    }
  }
}

module.exports = { ensureSchema };
