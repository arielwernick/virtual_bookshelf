/**
 * Create Better Auth account rows for existing users (issue #266).
 *
 * Usage:
 *   npm run auth:backfill -- --dry-run   # report what would change, write nothing
 *   npm run auth:backfill                # apply
 *
 * Needs migration 006 applied first (npm run migrate:up). Reads DATABASE_URL
 * from the environment. Run it on a Neon branch before production, and again
 * right before the cutover (#267) to cover anyone who signed up in between.
 * See lib/auth/backfill.ts for what it does and why it's safe to re-run.
 */

import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { backfillAuthAccounts, type BackfillClient } from '@/lib/auth/backfill';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const dryRun = process.argv.includes('--dry-run');
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    const result = await backfillAuthAccounts(client as unknown as BackfillClient, {
      dryRun,
    });
    const { before, after } = result;

    console.log(dryRun ? 'DRY RUN: nothing was written.\n' : 'Backfill applied.\n');
    console.log(`Users: ${after.users}`);
    console.log(`  with a password:  ${after.usersWithPassword}`);
    console.log(`  with Google:      ${after.usersWithGoogle}`);
    console.log('');
    console.log(
      `Credential accounts: ${before.credentialAccounts} -> ${after.credentialAccounts} (+${result.inserted.credential})`
    );
    console.log(
      `Google accounts:     ${before.googleAccounts} -> ${after.googleAccounts} (+${result.inserted.google})`
    );
    console.log(`Google users marked email-verified: ${result.markedVerified}`);
    console.log(`Users without any account: ${after.usersWithoutAccount}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
