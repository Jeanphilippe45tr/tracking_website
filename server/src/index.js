// -------------------------------------------------------------------
// Server bootstrap
// -------------------------------------------------------------------

const app = require("./app");
const env = require("./config/env");
const { sequelize, syncModels } = require("./models");
const { seedAll } = require("./seed");

async function start() {
  await sequelize.authenticate();
  console.log(
    `Connected to MySQL database "${env.db.name}" on ${env.db.host}:${env.db.port}`
  );

  if (env.seedOnStart) {
    const summary = await seedAll();
    console.log(
      `Seed ready: ${summary.shipments} shipments, ${summary.relayPoints} relay points, ` +
        `${summary.couriers} delivery people, ${summary.conversations} conversation(s), ` +
        `admin ${summary.admin}`
    );
  } else if (env.syncDatabase) {
    await syncModels();
    console.log("Database tables are up to date.");
  }

  const server = app.listen(env.port, () => {
    console.log(`API running at http://localhost:${env.port}/api`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received - shutting down...`);
    server.close(async () => {
      try {
        await sequelize.close();
      } finally {
        process.exit(0);
      }
    });
    // Force exit if connections refuse to close.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  console.error("Failed to start the server:", err.message);
  if (err.original) console.error(err.original.message);
  process.exit(1);
});
