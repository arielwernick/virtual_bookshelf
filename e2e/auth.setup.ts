import { test as setup } from '@playwright/test';
import { config } from 'dotenv';
import { assertNotProduction } from '../lib/db/prodGuard';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  authenticate,
  ensureSeededShelf,
  STORAGE_STATE,
  SEED_STATE,
} from './lib/auth';

/**
 * Authentication setup project.
 *
 * Runs once before the `authenticated` project: signs in (or signs up) the
 * test user, seeds a shelf with items, and persists the browser auth state to
 * STORAGE_STATE plus seed metadata to SEED_STATE. Authenticated specs then
 * reuse the cookie instead of logging in per test.
 */

setup('authenticate and seed', async ({ request, baseURL }) => {
  // Refuse to create the test user and shelf in production (issue #151).
  // Against a local dev server, check the database it uses (.env.local);
  // against a deployed URL, refuse the production site.
  const isLocal = !baseURL || /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(baseURL);
  if (isLocal) config({ path: ['.env.local', '.env'], quiet: true });
  assertNotProduction(
    { siteUrl: baseURL, databaseUrl: isLocal ? process.env.DATABASE_URL : undefined },
    { action: 'e2e seeding', allowVar: 'E2E_ALLOW_PROD' }
  );

  await authenticate(request);
  const seed = await ensureSeededShelf(request);

  await mkdir(path.dirname(STORAGE_STATE), { recursive: true });
  // Persist the session cookie set by the auth endpoints.
  await request.storageState({ path: STORAGE_STATE });
  await writeFile(SEED_STATE, JSON.stringify(seed, null, 2), 'utf-8');
});
