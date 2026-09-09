require("dotenv").config();
const jwt = require("jsonwebtoken");
const pg = require("pg");
(async () => {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const emails = ["admin@11cracks.com", "jugador@11cracks.com"];
  for (const email of emails) {
    const r = await c.query('SELECT id FROM "User" WHERE email=$1', [email]);
    if (r.rows.length === 0) { console.log("NO USER", email); continue; }
    const token = jwt.sign({ id: r.rows[0].id }, secret, { expiresIn: "30d" });
    console.log(email, token);
  }
  await c.end();
})();