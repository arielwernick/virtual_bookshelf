import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('Database');

/**
 * Pick the database URL for this environment.
 *
 * On Vercel preview deployments, the Neon integration creates a database
 * branch per preview and exposes it as BOOKSHELF_DATABASE_URL (the
 * integration's variable prefix). DATABASE_URL on Preview is the production
 * database, so previews must prefer the branch URL or they read and write
 * production data. Production and local development use DATABASE_URL.
 */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (env.VERCEL_ENV === 'preview' && env.BOOKSHELF_DATABASE_URL) {
    return env.BOOKSHELF_DATABASE_URL;
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
