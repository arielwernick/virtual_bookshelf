/**
 * Decide whether a Vercel build should apply pending migrations, and to which
 * database. See issue #277.
 *
 * Only preview builds migrate, and only against the preview's own Neon branch
 * (BOOKSHELF_DATABASE_URL_UNPOOLED, the direct connection the Neon integration
 * provides). Production builds never migrate. Anything that looks like the
 * production database is skipped.
 */
import { isProductionDatabaseUrl } from './prodGuard';

export type PreviewMigrationPlan =
  | { run: true; databaseUrl: string; endpoint: string }
  | { run: false; reason: string };

/** Neon endpoint id of a connection string, without the `-pooler` suffix. */
export function endpointOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.split('.')[0].replace(/-pooler$/, '');
  } catch {
    return null;
  }
}

export function planPreviewMigration(env: NodeJS.ProcessEnv = process.env): PreviewMigrationPlan {
  if (env.VERCEL_ENV !== 'preview') {
    return { run: false, reason: `not a preview build (VERCEL_ENV=${env.VERCEL_ENV ?? 'unset'})` };
  }

  const branchUrl = env.BOOKSHELF_DATABASE_URL_UNPOOLED;
  const endpoint = endpointOf(branchUrl);
  if (!branchUrl || !endpoint) {
    return { run: false, reason: 'no preview branch URL (BOOKSHELF_DATABASE_URL_UNPOOLED is missing or invalid)' };
  }

  // On Preview, DATABASE_URL is the production database. If the "branch" URL
  // points at the same endpoint, the integration didn't create a branch.
  if (isProductionDatabaseUrl(branchUrl, env) || endpoint === endpointOf(env.DATABASE_URL)) {
    return { run: false, reason: `branch URL points at the production database (${endpoint})` };
  }

  return { run: true, databaseUrl: branchUrl, endpoint };
}
