const { Sequelize } = require("sequelize");

const dialect = process.env.DB_DIALECT || "postgres";

// Render PostgreSQL requires SSL
const isRender = process.env.DATABASE_URL?.includes("render.com") ||
  process.env.DB_HOST?.includes("render.com");

let options;

if (dialect === "sqlite") {
  options = {
    storage: process.env.DB_STORAGE || "./data/tracking.db",
    logging: false,
  };
} else if (dialect === "postgres") {
  options = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    logging: false,
    dialectOptions: isRender
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  };
} else {
  // mysql
  options = {
    host: process.env.DB_HOST || "127.0.0.1",
    logging: false,
  };
}

// Support DATABASE_URL (Render, Neon, Supabase, etc.)
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      dialectOptions: isRender
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    })
  : new Sequelize(
      process.env.DB_NAME || "tracking_db",
      process.env.DB_USER || "root",
      process.env.DB_PASSWORD || "",
      { dialect, ...options }
    );

module.exports = sequelize;