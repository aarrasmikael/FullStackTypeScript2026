import "dotenv/config";
import { testDatabaseUrl } from "./testDb.js";

// Asetetaan ennen kuin mikään testattava moduuli (db.ts) importataan
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = testDatabaseUrl();
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-at-least-32-characters-long";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-at-least-32-chars-different";
