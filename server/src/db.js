const { Sequelize } = require("sequelize");

const dialect = process.env.DB_DIALECT || "mysql";

const options =
  dialect === "sqlite"
    ? { storage: process.env.DB_STORAGE || "./data/tracking.db", logging: false }
    : { host: process.env.DB_HOST || "127.0.0.1", logging: false };

const sequelize = new Sequelize(
  process.env.DB_NAME || "tracking_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  { dialect, ...options }
);

module.exports = sequelize;
