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

/**
 * The machine-facing surface: files and endpoints that crawlers, AI
 * assistants and embedding sites read. None of these need a database.
 */
test.describe('Machine-readable surface', () => {
  test('robots.txt lets crawlers fetch share images and keeps the API private', async ({ page }) => {
    const res = await page.request.get('/robots.txt');
    const body = await res.text();

    expect(res.status()).toBe(200);
    expect(body).toContain('Allow: /api/og/');
    expect(body).toContain('Disallow: /api/');
    expect(body).toContain('Disallow: /dashboard');
    expect(body).toMatch(/Sitemap: .+\/sitemap\.xml/);
  });

  test('llms.txt explains how to read a shelf', async ({ page }) => {
    const res = await page.request.get('/llms.txt');
    const body = await res.text();

    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    expect(body).toContain('# Virtual Bookshelf');
    expect(body).toContain('shelf.md');
  });

  test('oEmbed refuses URLs that are not shelves on this site', async ({ page }) => {
    const otherSite = await page.request.get(
      `/oembed?url=${encodeURIComponent('https://example.com/s/abc')}`
    );
    const noUrl = await page.request.get('/oembed');
    const xml = await page.request.get('/oembed?url=x&format=xml');

    expect(otherSite.status()).toBe(404);
    expect(noUrl.status()).toBe(400);
    expect(xml.status()).toBe(501);
  });

  test('account export needs a sign-in, and the old debug endpoint is gone', async ({ page }) => {
    expect((await page.request.get('/api/account/export')).status()).toBe(401);
    expect((await page.request.get('/api/auth/debug')).status()).toBe(404);
  });

  test('the main site sends a report-only content security policy, never an enforcing one', async ({ page }) => {
    const headers = (await page.request.get('/')).headers();

    expect(headers['content-security-policy-report-only']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toBeUndefined();
  });
});

/**
 * These read the database, so they run where one is configured: a Vercel
 * preview (its own Neon branch) or a local dev server with .env.local.
 * A shelf token that cannot exist keeps them independent of any real data.
 */
test.describe('Missing shelves', () => {
  const missing = '/s/no-such-shelf-zzzzzzzzzzzz';

  test('a missing shelf is a real 404, not a "not found" page served with 200', async ({ page }) => {
    const res = await page.goto(missing);

    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /shelf not found/i })).toBeVisible();
  });

  test('the machine-readable forms of a missing shelf are 404 too', async ({ page }) => {
    for (const form of ['shelf.md', 'shelf.json', 'feed.json']) {
      const res = await page.request.get(`${missing}/${form}`);
      expect(res.status(), form).toBe(404);
    }
  });

  test('the sitemap leaves out sign-in pages', async ({ page }) => {
    const res = await page.request.get('/sitemap.xml');
    const body = await res.text();

    expect(res.status()).toBe(200);
    expect(body).not.toMatch(/\/(login|signup)<\/loc>/);
  });
});
