/**
 * Vercel build step: apply pending migrations to a preview's own Neon branch
 * before `next build` (issue #277). Runs from the `vercel-build` script.
 *
 * - Production and local builds: does nothing.
 * - Preview without a branch URL, or pointing at production: logs and skips.
 * - Preview with a branch: runs migrate:up against it. A failed migration
 *   fails the build, so a broken migration shows up on the PR.
 *
 * Never prints a connection string; logs the Neon endpoint id only.
 */
import { planPreviewMigration } from '@/lib/db/previewMigrate';
import { migrateUp } from '@/lib/db/migrate';

async function main(): Promise<void> {
  const plan = planPreviewMigration();
  if (!plan.run) {
    console.log(`[preview-migrate] Skipping: ${plan.reason}.`);
    return;
  }

  console.log(`[preview-migrate] Applying pending migrations to preview branch endpoint ${plan.endpoint}`);
  process.env.DATABASE_URL = plan.databaseUrl;
  const applied = await migrateUp();
  console.log(
    applied.length === 0
      ? '[preview-migrate] Already up to date.'
      : `[preview-migrate] Applied migration(s): ${applied.join(', ')}`
  );
}

main().catch((error) => {
  console.error('[preview-migrate] Migration failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
