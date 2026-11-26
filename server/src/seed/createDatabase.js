const mysql = require("mysql2/promise");
const env = require("../config/env");

function assertSafeName(name) {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe database name: ${name}`);
  }
  return name;
}

(async () => {
  const name = assertSafeName(env.db.name);
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`Database "${name}" is ready.`);
  await connection.end();
})().catch((err) => {
  console.error("Could not create the database:", err.message);
  process.exit(1);
});
