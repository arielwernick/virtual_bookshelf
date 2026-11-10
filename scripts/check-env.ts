/**
 * Report which required env vars are missing, by name only (never values),
 * and whether DATABASE_URL points at production. Exits 0 either way: unit
 * tests need none of these, so this is advice, not a gate.
 *
 *   npx tsx scripts/check-env.ts
 */
import './lib/loadEnv';
import { isProductionDatabaseUrl } from '@/lib/db/prodGuard';

const REQUIRED = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'YOUTUBE_API_KEY',
  'NEXT_PUBLIC_BASE_URL',
];

const missing = REQUIRED.filter((name) => !process.env[name]);

if (missing.length === 0) {
  console.log('All required env vars are set.');
} else {
  console.log(`Missing env vars (needed for the dev server and e2e, not for unit tests): ${missing.join(', ')}`);
}

if (isProductionDatabaseUrl(process.env.DATABASE_URL)) {
  console.warn(
    'WARNING: DATABASE_URL points at PRODUCTION. Use the Neon "dev" branch for local work (see CLAUDE.md, Agent testing).'
  );
}
