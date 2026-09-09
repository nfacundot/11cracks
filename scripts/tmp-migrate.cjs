require("dotenv").config();
const fs = require("fs");
const pg = require("pg");
(async () => {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const sql = fs.readFileSync("prisma/migrations/20260909000000_add_games/migration.sql", "utf8");
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("OK: migration applied");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("FAIL:", e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();