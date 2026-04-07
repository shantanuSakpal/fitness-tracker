import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let cached: Database | null = null;

/**
 * Lazy init so `next build` can run without DATABASE_URL. At runtime the API
 * route must have DATABASE_URL or POSTGRES_URL set.
 *
 * Equivalent single-shot setup:
 * ```ts
 * const client = postgres(dbUrl);
 * export const db = drizzle(client, { schema });
 * ```
 */
export function getDb(): Database {
  if (cached) return cached;
  // biome-ignore lint/suspicious/noNonNullAssertion: POSTGRES_URL is fallback when DATABASE_URL unset
  const dbUrl = process.env.POSTGRES_URL!;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(dbUrl);
  cached = drizzle(client, { schema });
  return cached;
}
