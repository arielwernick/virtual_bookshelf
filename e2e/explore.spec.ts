import { test } from '@playwright/test';
import { captureRoute, writeIndex, type Route } from './lib/capture';

/**
 * Agent UI exploration — public (unauthenticated) routes.
 *
 * Writes screenshots + ARIA snapshots to e2e/artifacts/ plus a UI-MAP.md
 * index. For the logged-in surface see explore-auth.auth.spec.ts.
 * Run with: npm run e2e:explore
 */

const ROUTES: Route[] = [
  { path: '/', name: 'landing', purpose: 'Marketing home page with demo shelves' },
  { path: '/login', name: 'login', purpose: 'Returning-user sign in' },
  { path: '/signup', name: 'signup', purpose: 'New account creation' },
  { path: '/dashboard', name: 'dashboard', purpose: 'Authenticated shelf overview (redirects if logged out)' },
];

test.describe('Agent UI exploration (public)', () => {
  const blocks: string[] = [];

  for (const route of ROUTES) {
    test(`capture ${route.name} (${route.path})`, async ({ page }) => {
      blocks.push(...(await captureRoute(page, route)));
    });
  }

  test.afterAll(async () => {
    await writeIndex('UI-MAP.md', 'UI Map — public (agent perspective)', blocks);
  });
});
