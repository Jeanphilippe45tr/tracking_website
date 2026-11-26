const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

// A single row (id = 1) that holds the current public live-tracking run.
// Keeping it in MySQL means every visitor sees the same parcel, instead
// of the simulation living only in the admin's browser localStorage.
class LiveState extends Model {}

LiveState.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
      autoIncrement: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "idle",
      validate: {
        isIn: [["idle", "running", "paused", "stopped", "completed"]],
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
    // Progress already covered before the current running segment began.
    baseProgress: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    speed: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 2,
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
    modelName: "LiveState",
    tableName: "live_state",
    timestamps: true,
  }
);

module.exports = LiveState;
