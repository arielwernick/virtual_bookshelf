import { test as setup } from '@playwright/test';
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

setup('authenticate and seed', async ({ request }) => {
  await authenticate(request);
  const seed = await ensureSeededShelf(request);

  await mkdir(path.dirname(STORAGE_STATE), { recursive: true });
  // Persist the session cookie set by the auth endpoints.
  await request.storageState({ path: STORAGE_STATE });
  await writeFile(SEED_STATE, JSON.stringify(seed, null, 2), 'utf-8');
});
