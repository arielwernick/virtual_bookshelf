/**
 * CLI entrypoint for the database migration runner.
 *
 * Usage (via npm scripts):
 *   npm run migrate:up       # apply all pending migrations (idempotent)
 *   npm run migrate:status   # show applied / pending migrations
 *   npm run migrate:down     # roll back the most recent migration
 *   npm run db:bootstrap      # alias for migrate:up (empty DB -> current schema)
 *
 * Or directly:
 *   npx tsx scripts/migrate.ts up
 *
 * Reads DATABASE_URL from the shell, then .env.local, then .env.
 * For CI / ephemeral test databases, set DATABASE_URL inline before invoking.
 *
 * `up` and `down` refuse to run against the production database unless
 * MIGRATE_ALLOW_PROD=1 is set (issue #151). `status` is read-only and always runs.
 */

import './lib/loadEnv';
import { migrateUp, migrateDown, migrationStatus } from '@/lib/db/migrate';
import { assertNotProduction } from '@/lib/db/prodGuard';

type Command = 'up' | 'down' | 'status';

async function run(command: Command): Promise<void> {
  switch (command) {
    case 'up': {
      const applied = await migrateUp();
      if (applied.length === 0) {
        console.log('Database is already up to date. Nothing to apply.');
      } else {
        console.log(
          `Applied ${applied.length} migration(s): ${applied.join(', ')}`
        );
      }
      break;
    }
    case 'down': {
      const version = await migrateDown();
      console.log(`Rolled back migration ${version}.`);
      break;
    }
    case 'status': {
      const rows = await migrationStatus();
      if (rows.length === 0) {
        console.log('No migration files found in migrations/.');
        break;
      }
      console.log('Migration status:');
      for (const row of rows) {
        const marker = row.applied ? '[applied]' : '[pending]';
        console.log(`  ${marker} ${row.filename}`);
      }
      const pending = rows.filter((r) => !r.applied).length;
      console.log(
        pending === 0
          ? 'All migrations applied.'
          : `${pending} migration(s) pending.`
      );
      break;
    }
  }
}

function parseCommand(arg: string | undefined): Command {
  if (arg === 'up' || arg === 'down' || arg === 'status') {
    return arg;
  }
  console.error(
    `Unknown command: ${arg ?? '(none)'}\nUsage: tsx scripts/migrate.ts <up|down|status>`
  );
  process.exit(1);
}

const command = parseCommand(process.argv[2]);

if (command !== 'status') {
  try {
    const allowed = assertNotProduction(
      { databaseUrl: process.env.DATABASE_URL },
      { action: `migrate:${command}`, allowVar: 'MIGRATE_ALLOW_PROD' }
    );
    if (allowed) console.warn(`MIGRATE_ALLOW_PROD=1: running migrate:${command} against PRODUCTION.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

run(command)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      'Migration command failed:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  });
