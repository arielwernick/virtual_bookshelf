/**
 * Guard against local tooling (migrations, seeds, e2e seeding) writing to the
 * production database or site by accident. See issue #151.
 *
 * Local development uses a Neon "dev" branch. The production database is
 * recognized by its Neon endpoint id, which is not a secret: it can't be used
 * without the password in the connection string. Extra hosts can be added with
 * PRODUCTION_DB_HOSTS (comma-separated host names or Neon endpoint ids).
 */

/** Neon endpoint ids of the production database (pooled and direct share it). */
export const PRODUCTION_DB_ENDPOINTS = ['ep-broad-resonance-ahfg834z'];

/** Host names of the production site. */
export const PRODUCTION_SITE_HOSTS = ['virtualbookshelf.app', 'www.virtualbookshelf.app'];

export class ProductionGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductionGuardError';
  }
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function productionDbHosts(env: NodeJS.ProcessEnv): string[] {
  const extra = (env.PRODUCTION_DB_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...PRODUCTION_DB_ENDPOINTS, ...extra];
}

/**
 * True when the connection string points at the production database.
 * Matches the Neon endpoint id with or without the `-pooler` suffix, or an
 * exact host from PRODUCTION_DB_HOSTS.
 */
export function isProductionDatabaseUrl(
  url: string | undefined,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (!url) return false;
  const host = hostOf(url);
  if (!host) return false;
  const firstLabel = host.split('.')[0].replace(/-pooler$/, '');
  return productionDbHosts(env).some((known) => known === host || known === firstLabel);
}

/** True when the URL is the production site. */
export function isProductionSiteUrl(url: string | undefined): boolean {
  if (!url) return false;
  const host = hostOf(url);
  return host !== null && PRODUCTION_SITE_HOSTS.includes(host);
}

interface GuardOptions {
  /** What is about to happen, for the error message (e.g. "migrate:down"). */
  action: string;
  /** Env var that allows the action against production when set to "1". */
  allowVar: string;
  env?: NodeJS.ProcessEnv;
}

/**
 * Throw unless the target is not production, or the caller explicitly allowed
 * production with `<allowVar>=1`. Returns true when production was allowed.
 */
export function assertNotProduction(
  target: { databaseUrl?: string; siteUrl?: string },
  { action, allowVar, env = process.env }: GuardOptions
): boolean {
  const isProd =
    isProductionDatabaseUrl(target.databaseUrl, env) || isProductionSiteUrl(target.siteUrl);
  if (!isProd) return false;
  if (env[allowVar] === '1') return true;
  throw new ProductionGuardError(
    `Refusing to run ${action} against PRODUCTION. ` +
      `Point DATABASE_URL at the Neon "dev" branch (see .env.local), ` +
      `or set ${allowVar}=1 if you really mean to change production.`
  );
}
