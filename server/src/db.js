// -------------------------------------------------------------------
// Sequelize connection (MySQL / MariaDB, local or hosted).
// -------------------------------------------------------------------
// Two ways to configure the database:
//   1. DATABASE_URL=mysql://user:pass@host:port/database   (hosted)
//   2. DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD (local)
// Set DB_SSL=true when the provider requires TLS (most free plans do).
// -------------------------------------------------------------------

const { Sequelize } = require("sequelize");
const env = require("./config/env");

const commonOptions = {
  dialect: "mysql",
  logging: env.isProduction ? false : console.log,
  // MySQL returns DECIMAL columns as strings by default. The frontend
  // expects a number for shipment weight, so let the driver convert.
  dialectOptions: {
    decimalNumbers: true,
    ...(env.db.ssl
      ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }
      : {}),
  },
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

const sequelize = env.db.url
  ? new Sequelize(env.db.url, commonOptions)
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      ...commonOptions,
      host: env.db.host,
      port: env.db.port,
    });

module.exports = sequelize;
