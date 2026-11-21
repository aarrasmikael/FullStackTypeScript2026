import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { testDatabaseUrl } from "./testDb.js";

// Luo testitietokannan tarvittaessa ja ajaa migraatiot puhtaaseen skeemaan ennen testejä.
// Migraatio-SQL luetaan suoraan prisma/migrations-kansiosta.
export default async function setup() {
  const testUrl = testDatabaseUrl();
  const dbName = new URL(testUrl).pathname.slice(1);

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
  }
  await admin.end();

  const client = new pg.Client({ connectionString: testUrl });
  await client.connect();
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");

  const migrationsDir = join(process.cwd(), "prisma", "migrations");
  const folders = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  for (const folder of folders) {
    await client.query(readFileSync(join(migrationsDir, folder, "migration.sql"), "utf8"));
  }
  await client.end();
}
