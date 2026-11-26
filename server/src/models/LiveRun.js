const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

// One simulated live delivery. Unlike the old single-row live_state table,
// this holds several rows so the admin can run more than one route at the
// same time. Progress is derived from time on the server, so every visitor
// sees the same position without depending on the admin's browser.
class LiveRun extends Model {}

LiveRun.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "running",
      validate: {
        isIn: [["running", "paused", "stopped", "completed"]],
      },
    },
    trackNumber: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    shipmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    origin: {
      type: DataTypes.STRING(160),
      allowNull: false,
      defaultValue: "",
    },
    destination: {
      type: DataTypes.STRING(160),
      allowNull: false,
      defaultValue: "",
    },
    // Snapshot of the coordinates, so a run keeps its route even if the
    // shipment is edited later.
    originLat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    originLng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    destinationLat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    destinationLng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    // Progress already covered before the current running segment began.
    baseProgress: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    // Real-world travel settings. `speed` is kept as the km/h value so
    // older serializers keep working; the mode is the user-facing choice.
    transportMode: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: "road",
    },
    speedKmh: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 70,
    },
    speed: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 70,
    },
    distanceKm: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    // Zero means "old row created before real speeds" — progressOf then
    // falls back to the legacy multiplier stored in `speed`.
    durationMs: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    // Start of the current running segment (null while paused/stopped).
    runningSince: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "LiveRun",
    tableName: "live_runs",
    timestamps: true,
    indexes: [{ fields: ["status"] }, { fields: ["trackNumber"] }],
  }
);

module.exports = LiveRun;
