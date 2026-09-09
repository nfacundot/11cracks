require("dotenv").config();
const pg = require("pg");
(async () => {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query(
    'SELECT g.slug, g.name, g.category, g.active, (SELECT count(*) FROM "OidoCrackWord" o WHERE o."gameId"=g.id) AS oido,(SELECT count(*) FROM "GolPalabraWord" o WHERE o."gameId"=g.id) AS gol,(SELECT count(*) FROM "LetrasCrackWord" o WHERE o."gameId"=g.id) AS letras FROM "Game" g ORDER BY g.order'
  );
  r.rows.forEach((x) =>
    console.log(x.slug, "|", x.name, "|", x.category, "| act:" + x.active, "| oido:" + x.oido, "gol:" + x.gol, "letras:" + x.letras)
  );
  await c.end();
})();