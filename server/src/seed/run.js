// -------------------------------------------------------------------
// CLI: npm run db:seed   -> create tables + insert demo data
//      npm run db:reset  -> DROP/recreate tables + insert demo data
// -------------------------------------------------------------------

const { seedAll } = require("./index");
const { sequelize } = require("../models");

(async () => {
  const reset = process.argv.includes("--reset");
  const summary = await seedAll({ reset });

  console.log(
    `Seed complete${reset ? " (database reset)" : ""}:`,
    `${summary.shipments} shipments,`,
    `${summary.relayPoints} relay points,`,
    `${summary.conversations} conversation(s) - admin ${summary.admin}`
  );

  await sequelize.close();
})().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await sequelize.close();
  } catch {
    // ignore
  }
  process.exit(1);
});
