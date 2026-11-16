/**
 * A stand-in for lib/db/client.ts backed by PGlite: real Postgres, compiled
 * to WebAssembly, running inside the test process.
 *
 * Unit tests mock the database, so they prove what a query is called with,
 * not that Postgres accepts it. Tests that use this file run the real
 * queries in lib/db/queries.ts against a real engine with the real
 * migrations applied. No network, no Neon account, no credentials.
 *
 * Use it from a test file like this (see lib/db/queries.integration.test.ts):
 *
 *   // @vitest-environment node
 *   vi.mock('./client', () => import('@/test/utils/pgliteClient'));
 *   beforeAll(resetTestDatabase);
 *
 * What it does not prove: behaviour specific to Neon's HTTP driver, such as
 * how it sends a transaction. It proves the SQL and the schema.
 */

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

let db: PGlite | null = null;

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

/** Up migrations in number order, the same files production runs. */
export function migrationFiles(suffix: '.sql' | '.down.sql' = '.sql'): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) =>
      suffix === '.down.sql' ? name.endsWith('.down.sql') : name.endsWith('.sql') && !name.endsWith('.down.sql')
    )
    .sort();
}

export function readMigration(filename: string): string {
  return readFileSync(join(MIGRATIONS_DIR, filename), 'utf8');
}

/** Start a fresh, empty database and apply every migration to it. */
export async function resetTestDatabase(): Promise<PGlite> {
  if (db) await db.close();
  db = new PGlite({ extensions: { pgcrypto } });
  for (const file of migrationFiles()) {
    await db.exec(readMigration(file));
  }
  return db;
}

export function getTestDatabase(): PGlite {
  if (!db) throw new Error('Call resetTestDatabase() in beforeAll first');
  return db;
}

/** Turn a tagged template into a parameterised query: `a ${x} b` -> "a $1 b". */
function toQuery(strings: TemplateStringsArray, values: unknown[]) {
  const text = strings.reduce(
    (acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ''),
    ''
  );
  return { text, values };
}

// --- The three exports of lib/db/client.ts that queries.ts uses -------------

export const sql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const { text } = toQuery(strings, values);
  return (await getTestDatabase().query(text, values)).rows;
};

export async function sqlQuery(queryString: string, values?: unknown[]): Promise<unknown[]> {
  return (await getTestDatabase().query(queryString, values ?? [])).rows;
}

/** All statements run in one transaction; any failure rolls every one back. */
export async function sqlTransaction(
  build: (
    tx: (strings: TemplateStringsArray, ...values: unknown[]) => { text: string; values: unknown[] }
  ) => { text: string; values: unknown[] }[]
): Promise<unknown[]> {
  const statements = build((strings, ...values) => toQuery(strings, values));
  return getTestDatabase().transaction(async (tx) => {
    const results: unknown[] = [];
    for (const statement of statements) {
      results.push((await tx.query(statement.text, statement.values)).rows);
    }
    return results;
  });
}

export function resolveDatabaseUrl(): string | undefined {
  return undefined;
}
