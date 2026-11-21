// Testitietokanta on sama Postgres-palvelin kuin kehityksessä, mutta oma tietokanta (<nimi>_test)
export function testDatabaseUrl(): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL puuttuu (.env)");
  const url = new URL(base);
  const dbName = url.pathname.replace(/^\//, "");
  url.pathname = `/${dbName.endsWith("_test") ? dbName : `${dbName}_test`}`;
  return url.toString();
}
