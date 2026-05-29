import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { captureRoute, writeIndex, type Route } from './lib/capture';
import { SEED_STATE, type SeedState } from './lib/auth';

/**
 * Agent UI exploration — authenticated routes.
 *
 * Runs under the `authenticated` project (reuses the session cookie produced
 * by auth.setup.ts) so it can reach the logged-in surface: the populated
 * dashboard, a real shelf detail/edit page, and the import flow. Writes to
 * e2e/artifacts/ with a UI-MAP-AUTH.md index.
 */

let seed: SeedState;

test.beforeAll(async () => {
  seed = JSON.parse(await readFile(SEED_STATE, 'utf-8')) as SeedState;
});

test.describe('Agent UI exploration (authenticated)', () => {
  const blocks: string[] = [];

  test('dashboard shows the seeded shelf', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Agent Demo Shelf')).toBeVisible();
    blocks.push(...(await captureRoute(page, {
      path: '/dashboard',
      name: 'dashboard-authed',
      purpose: 'Logged-in shelf overview with the seeded shelf',
    })));
  });

  test('shelf detail page renders seeded items', async ({ page }) => {
    const route: Route = {
      path: `/shelf/${seed.shelfId}`,
      name: 'shelf-detail',
      purpose: 'Shelf editor with seeded items',
    };
    blocks.push(...(await captureRoute(page, route)));
    await expect(page.getByText('The Pragmatic Programmer')).toBeVisible();
  });

  test('import page renders', async ({ page }) => {
    blocks.push(...(await captureRoute(page, {
      path: '/import',
      name: 'import',
      purpose: 'Bulk-import items into a shelf',
    })));
  });

  test.afterAll(async () => {
    await writeIndex('UI-MAP-AUTH.md', 'UI Map — authenticated (agent perspective)', blocks);
  });
});
