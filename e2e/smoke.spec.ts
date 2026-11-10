import { test, expect } from '@playwright/test';

/**
 * Smoke tests: verify the public, unauthenticated surface renders.
 * These intentionally avoid touching the database-backed demo content so
 * they pass even when no demo shelves are configured.
 */

test.describe('Public pages render', () => {
  test('landing page shows the hero', async ({ page }) => {
    await page.goto('/');
    // Check for a main heading, not its exact copy, so headline changes
    // don't break the smoke test.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('login page has username + password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('textbox', { name: /username/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
  });

  test('signup page has account creation fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('textbox', { name: /username/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^email$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('dashboard redirects unauthenticated users away', async ({ page }) => {
    await page.goto('/dashboard');
    // Unauthenticated visitors should not land on a functional dashboard.
    await expect(page).not.toHaveURL(/\/dashboard\/?$/);
  });
});
