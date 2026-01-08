import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('Database');

// Lazy initialization - only create connection when first used (runtime)
let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const databaseUrl = process.env.DATABASE_URL;
    
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
