/**
 * Backfill canonical identifiers on existing items (issue #288).
 *
 * New and edited items get `source` / `source_id` as they are written. This
 * script fills them in for items created before migration 007, by reading
 * each item's URL with the same pure function the app uses
 * (lib/utils/itemIdentity.ts). It never calls an outside API and never
 * touches titles, notes or anything a person wrote.
 *
 * Usage:
 *   npx tsx scripts/backfill-item-identity.ts            # dry run: report only
 *   npx tsx scripts/backfill-item-identity.ts --apply    # write the changes
 *
 * Reads DATABASE_URL from the shell, then .env.local, then .env. A dry run is
 * read-only and runs anywhere. --apply refuses the production database unless
 * MIGRATE_ALLOW_PROD=1 is set, like the migration it follows.
 *
 * Idempotent: run it again and it finds nothing to change.
 */

import './lib/loadEnv';
import { sql, resolveDatabaseUrl } from '@/lib/db/client';
import { assertNotProduction } from '@/lib/db/prodGuard';
import { deriveItemIdentity } from '@/lib/utils/itemIdentity';
import type { ItemType } from '@/lib/types/shelf';

interface Row {
  id: string;
  type: ItemType;
  external_url: string | null;
  creator: string | null;
  source: string | null;
  source_id: string | null;
}

export interface BackfillChange {
  id: string;
  source: string;
  sourceId: string;
}

/** Decide what to write for each row. Pure, so it can be unit tested. */
export function planBackfill(rows: Row[]): { changes: BackfillChange[]; bySource: Record<string, number>; unidentified: number } {
  const changes: BackfillChange[] = [];
  const bySource: Record<string, number> = {};
  let unidentified = 0;

  for (const row of rows) {
    const identity = deriveItemIdentity(row.type, row.external_url, row.creator);
    if (!identity) {
      unidentified += 1;
      continue;
    }
    if (row.source === identity.source && row.source_id === identity.sourceId) continue;
    changes.push({ id: row.id, source: identity.source, sourceId: identity.sourceId });
    bySource[identity.source] = (bySource[identity.source] ?? 0) + 1;
  }

  return { changes, bySource, unidentified };
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  if (apply) {
    assertNotProduction(
      { databaseUrl: resolveDatabaseUrl() },
      { action: 'the item identifier backfill', allowVar: 'MIGRATE_ALLOW_PROD' }
    );
  }

  const rows = (await sql`
    SELECT id, type, external_url, creator, source, source_id FROM items
  `) as Row[];

  const { changes, bySource, unidentified } = planBackfill(rows);

  console.log(`Items checked: ${rows.length}`);
  console.log(`No identifier in the URL: ${unidentified}`);
  console.log(`To set or correct: ${changes.length}`);
  for (const [source, count] of Object.entries(bySource).sort()) {
    console.log(`  ${source}: ${count}`);
  }

  if (!apply) {
    console.log('\nDry run: nothing was written. Re-run with --apply to write.');
    return;
  }

  for (const change of changes) {
    await sql`
      UPDATE items SET source = ${change.source}, source_id = ${change.sourceId}
      WHERE id = ${change.id}
    `;
  }
  console.log(`\nUpdated ${changes.length} item(s).`);
}

// Only run when executed directly, not when imported by a test.
if (process.argv[1]?.includes('backfill-item-identity')) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
