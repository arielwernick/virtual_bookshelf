import { neon, NeonQueryFunction, NeonQueryFunctionInTransaction, NeonQueryInTransaction } from '@neondatabase/serverless';
import { createLogger } from '@/lib/utils/logger';
import { isProductionDatabaseUrl } from './prodGuard';

const logger = createLogger('Database');

/**
 * Pick the database URL for this environment.
 *
 * Vercel previews read BOOKSHELF_DATABASE_URL: the shared Neon `dev` branch
 * for most pull requests, or a pull request's own branch when it is marked as
 * a database change (`.github/workflows/preview-db.yml`). DATABASE_URL on
 * Preview is the production database, so a preview without
 * BOOKSHELF_DATABASE_URL, or with one that points at production, fails
 * instead of reading and writing production data.
 *
 * Production and local development use DATABASE_URL.
 */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (env.VERCEL_ENV === 'preview') {
    const previewUrl = env.BOOKSHELF_DATABASE_URL;
    if (!previewUrl) {
      throw new Error(
        'BOOKSHELF_DATABASE_URL is not set for this preview. Set it on Vercel\'s Preview environment to the Neon dev branch.'
      );
    }
    if (isProductionDatabaseUrl(previewUrl, env)) {
      throw new Error('BOOKSHELF_DATABASE_URL points at the production database. Previews must use the dev branch or their own branch.');
    }
    return previewUrl;
  }
  return env.DATABASE_URL;
}

// Lazy initialization - only create connection when first used (runtime)
let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const databaseUrl = resolveDatabaseUrl();

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    _sql = neon(databaseUrl);
  }
  
  return _sql;
}

// Export wrapper function that creates connection on first use
export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
  return getSql()(strings, ...values);
}) as NeonQueryFunction<false, false>;

// Parameterized query using sql.query() — required by newer Neon SDK versions
// that no longer support calling the function as sql("SELECT $1", [value])
export function sqlQuery(queryString: string, values?: unknown[]): Promise<unknown[]> {
  const fn = getSql() as unknown as { query: (q: string, p?: unknown[]) => Promise<unknown[]> };
  return fn.query(queryString, values);
}

/**
 * Run several statements as one transaction, in one round trip.
 *
 * The Neon HTTP driver has no interactive transactions: the statements are
 * built up front and sent together. If any of them fails, none is applied.
 *
 *   await sqlTransaction((tx) => [tx`UPDATE ...`, tx`UPDATE ...`]);
 */
export function sqlTransaction(
  build: (tx: NeonQueryFunctionInTransaction<false, false>) => NeonQueryInTransaction[]
): Promise<unknown[]> {
  return getSql().transaction(build);
}

// Helper function to test database connection
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    logger.info('Database connected successfully', { 
      currentTime: result[0].current_time 
    });
    return true;
  } catch (error) {
    logger.errorWithException('Database connection failed', error);
    return false;
  }
}
