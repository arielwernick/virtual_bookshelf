/**
 * Lightweight, idempotent database migration runner for Neon Postgres.
 *
 * Why a custom runner (not node-pg-migrate / an ORM):
 * - The app uses raw SQL via the Neon serverless driver (no ORM). Adopting
 *   Drizzle/Prisma would be a large refactor of `lib/db/queries.ts` and is out
 *   of scope (see issue #88).
 * - `node-pg-migrate` is built around the `pg` driver; this runner reuses the
 *   Neon serverless driver already in the project (`Pool` over WebSockets) so
 *   there is no second database client to configure.
 * - The whole surface we need is small: track applied migrations in a
 *   `schema_migrations` table, run numbered `.sql` files in order inside a
 *   transaction, and be safe to re-run (idempotent). That is exactly what this
 *   file does, and it is trivially usable from CI / agents / ephemeral test DBs
 *   (see issue #147).
 *
 * Migration files live in `migrations/` and are named `NNN_description.sql`
 * (e.g. `001_initial_schema.sql`). Files are applied in lexical order of their
 * numeric prefix. Each file runs in a single transaction; if it throws, the
 * transaction is rolled back and the migration is NOT recorded as applied.
 *
 * Optional rollback: a migration may ship a sibling `NNN_description.down.sql`
 * file. `migrate down` runs the most recent applied migration's down file (if
 * present) and removes its row from `schema_migrations`.
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Pool } from '@neondatabase/serverless';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('Migrate');

export const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

export interface MigrationFile {
  /** Numeric prefix, e.g. 1 for `001_initial_schema.sql`. */
  version: number;
  /** Full filename, e.g. `001_initial_schema.sql`. */
  filename: string;
  /** Absolute path to the up file. */
  path: string;
}

export interface MigrationStatusRow {
  version: number;
  filename: string;
  applied: boolean;
}

const MIGRATION_FILE_RE = /^(\d+)_.*\.sql$/;
const DOWN_SUFFIX_RE = /\.down\.sql$/;

/**
 * Read and parse the up-migration files from `dir`, sorted ascending by
 * numeric version. Down files (`*.down.sql`) are excluded from this list.
 */
export function loadMigrationFiles(dir: string = MIGRATIONS_DIR): MigrationFile[] {
  if (!existsSync(dir)) {
    throw new Error(`Migrations directory not found: ${dir}`);
  }

  const files = readdirSync(dir).filter(
    (f) => MIGRATION_FILE_RE.test(f) && !DOWN_SUFFIX_RE.test(f)
  );

  const migrations = files.map((filename) => {
    const match = filename.match(MIGRATION_FILE_RE);
    // The filter above guarantees a match.
    const version = Number(match![1]);
    return { version, filename, path: join(dir, filename) };
  });

  migrations.sort((a, b) => a.version - b.version);

  // Guard against duplicate version prefixes which would make ordering
  // ambiguous and silently skip migrations.
  const seen = new Set<number>();
  for (const m of migrations) {
    if (seen.has(m.version)) {
      throw new Error(`Duplicate migration version ${m.version} (${m.filename})`);
    }
    seen.add(m.version);
  }

  return migrations;
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
}

/**
 * Create the migration-tracking table if it does not already exist.
 * Idempotent.
 */
async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      filename TEXT NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedVersions(pool: Pool): Promise<Set<number>> {
  const result = await pool.query<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version ASC'
  );
  return new Set(result.rows.map((r) => Number(r.version)));
}

/**
 * Apply all pending migrations in order. Safe to re-run: already-applied
 * migrations are skipped, so running against an up-to-date DB is a no-op, and
 * running against an empty DB bootstraps it fully.
 *
 * Returns the list of versions that were applied during this call.
 */
export async function migrateUp(dir: string = MIGRATIONS_DIR): Promise<number[]> {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  const applied: number[] = [];

  try {
    await ensureMigrationsTable(pool);
    const alreadyApplied = await getAppliedVersions(pool);
    const migrations = loadMigrationFiles(dir);

    const pending = migrations.filter((m) => !alreadyApplied.has(m.version));

    if (pending.length === 0) {
      logger.info('Database is already up to date; no migrations to apply', {
        appliedCount: alreadyApplied.size,
      });
      return applied;
    }

    for (const migration of pending) {
      const sql = readFileSync(migration.path, 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, filename) VALUES ($1, $2)',
          [migration.version, migration.filename]
        );
        await client.query('COMMIT');
        applied.push(migration.version);
        logger.info('Applied migration', {
          version: migration.version,
          filename: migration.filename,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        logger.errorWithException('Migration failed; rolled back', error, {
          version: migration.version,
          filename: migration.filename,
        });
        throw error;
      } finally {
        client.release();
      }
    }

    logger.info('Migrations complete', { appliedCount: applied.length });
    return applied;
  } finally {
    await pool.end();
  }
}

/**
 * Roll back the most recently applied migration, if it has a sibling
 * `*.down.sql` file. Throws if there is nothing to roll back or no down file
 * exists for the latest migration.
 *
 * Returns the version that was rolled back.
 */
export async function migrateDown(dir: string = MIGRATIONS_DIR): Promise<number> {
  const pool = new Pool({ connectionString: getDatabaseUrl() });

  try {
    await ensureMigrationsTable(pool);
    const result = await pool.query<{ version: number; filename: string }>(
      'SELECT version, filename FROM schema_migrations ORDER BY version DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      throw new Error('No applied migrations to roll back');
    }

    const { version, filename } = result.rows[0];
    const downFilename = filename.replace(/\.sql$/, '.down.sql');
    const downPath = join(dir, downFilename);

    if (!existsSync(downPath)) {
      throw new Error(
        `No rollback file found for migration ${version} (expected ${downFilename}). ` +
          'This migration is irreversible or has no down script.'
      );
    }

    const sql = readFileSync(downPath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('DELETE FROM schema_migrations WHERE version = $1', [
        version,
      ]);
      await client.query('COMMIT');
      logger.info('Rolled back migration', { version, filename: downFilename });
      return Number(version);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.errorWithException('Rollback failed; reverted', error, { version });
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

/**
 * Return the applied/pending status of every known migration.
 */
export async function migrationStatus(
  dir: string = MIGRATIONS_DIR
): Promise<MigrationStatusRow[]> {
  const pool = new Pool({ connectionString: getDatabaseUrl() });

  try {
    await ensureMigrationsTable(pool);
    const alreadyApplied = await getAppliedVersions(pool);
    const migrations = loadMigrationFiles(dir);

    return migrations.map((m) => ({
      version: m.version,
      filename: m.filename,
      applied: alreadyApplied.has(m.version),
    }));
  } finally {
    await pool.end();
  }
}
