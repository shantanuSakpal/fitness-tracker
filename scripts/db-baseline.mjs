/**
 * Use when `npm run db:migrate` fails with "relation ... already exists":
 * tables were created earlier, but `drizzle.__drizzle_migrations` has no record.
 *
 * This inserts a row for migration 0000 only (same hash Drizzle expects), then
 * run `npm run db:migrate` to apply 0001 (legacy text→real weight, unique_foods if missing).
 */
import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

function loadEnvFromDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadEnvFromDotEnv();

const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";
if (!url) {
  console.error("Set POSTGRES_URL or DATABASE_URL in .env");
  process.exit(1);
}

const journal = JSON.parse(
  readFileSync(resolve("lib/db/migrations/meta/_journal.json"), "utf8")
);
const entry0 = journal.entries[0];
if (!entry0?.tag) {
  console.error("Invalid journal: missing first migration");
  process.exit(1);
}

const path0 = resolve("lib/db/migrations", `${entry0.tag}.sql`);
const sql0 = readFileSync(path0, "utf8");
const hash = crypto.createHash("sha256").update(sql0).digest("hex");

const pool = new pg.Pool({
  connectionString: url,
  ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
});

try {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await pool.query(`
		CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
			id SERIAL PRIMARY KEY,
			hash text NOT NULL,
			created_at bigint
		)
	`);

  const hasFoods = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foods'`
  );
  if (hasFoods.rowCount === 0) {
    console.error(
      "Refusing to baseline: public.foods is missing. On an empty database run `npm run db:migrate` only."
    );
    process.exit(1);
  }

  const dup = await pool.query(
    `SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1`,
    [hash]
  );
  if (dup.rowCount > 0) {
    console.log(
      `Already baselined: ${entry0.tag} is recorded. Run: npm run db:migrate`
    );
    process.exit(0);
  }

  await pool.query(
    `INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at") VALUES ($1, $2)`,
    [hash, entry0.when]
  );
  console.log(
    `Baselined ${entry0.tag}. Next: npm run db:migrate (applies any pending migrations, e.g. 0001).`
  );
} finally {
  await pool.end();
}
