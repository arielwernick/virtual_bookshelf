import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE } from './e2e/lib/auth';

/**
 * Playwright configuration for Virtual Bookshelf.
 *
 * Two intended audiences:
 * 1. Humans/CI running end-to-end UI checks (`npm run e2e`).
 * 2. Agents exploring the running UI to understand layout, copy, and the
 *    accessibility tree (`npm run e2e:explore`). See e2e/README.md.
 *
 * The dev server is started automatically unless one is already running on
 * the target port, so a single command spins everything up.
 */

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  // Agent exploration writes screenshots + aria snapshots here.
  snapshotDir: './e2e/snapshots',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Authenticates + seeds once, persisting state for the authenticated project.
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Public, unauthenticated surface (smoke + public exploration).
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/.*\.setup\.ts/, /.*\.auth\.spec\.ts/],
    },
    // Logged-in surface — reuses the session cookie produced by `setup`.
    {
      name: 'authenticated',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      testMatch: /.*\.auth\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],

  // Reuse an already-running dev server locally; start one in CI / when idle.
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
