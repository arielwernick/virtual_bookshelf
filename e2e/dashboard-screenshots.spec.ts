import { test, type APIRequestContext } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { authenticate } from './lib/auth';

/**
 * Captures dashboard screenshots for documentation / PR previews.
 *
 * Authenticates through the real signup/login API (no forged sessions, no
 * direct DB access), seeds a couple of demo shelves with real cover art so
 * the library-style preview renders representatively, then screenshots the
 * dashboard. Idempotent: reuses the demo shelves if they already exist.
 *
 * Run with: npx playwright test dashboard-screenshots --project=public
 */

const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

const DEMO_SHELVES = [
  {
    name: 'Engineering Bookshelf',
    description: 'The books that shaped how I build software.',
    items: [
      { type: 'book', title: 'The Pragmatic Programmer', creator: 'Hunt & Thomas', image_url: 'https://books.google.com/books/content?id=LhOlDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
      { type: 'book', title: 'Designing Data-Intensive Applications', creator: 'Martin Kleppmann', image_url: 'https://books.google.com/books/content?id=zFheDgAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
      { type: 'book', title: 'Clean Code', creator: 'Robert C. Martin', image_url: 'https://books.google.com/books/content?id=hjEFCAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
      { type: 'book', title: 'Refactoring', creator: 'Martin Fowler', image_url: 'https://books.google.com/books/content?id=2H1_DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
      { type: 'book', title: 'The Mythical Man-Month', creator: 'Fred Brooks', image_url: 'https://covers.openlibrary.org/b/isbn/9780201835953-L.jpg' },
      { type: 'book', title: 'Code Complete', creator: 'Steve McConnell', image_url: 'https://books.google.com/books/content?id=LpVCAwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
      { type: 'book', title: 'Domain-Driven Design', creator: 'Eric Evans', image_url: 'https://books.google.com/books/content?id=7dlaMs0SECsC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    ],
  },
  {
    name: 'Listening Queue',
    description: 'A mix of covers and title spines.',
    items: [
      { type: 'podcast', title: "Lenny's Podcast", creator: 'Lenny Rachitsky' },
      { type: 'podcast', title: 'Acquired', creator: 'Ben & David' },
      { type: 'book', title: 'Atomic Habits', creator: 'James Clear', image_url: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg' },
      { type: 'link', title: 'A Philosophy of Software Design', creator: 'John Ousterhout' },
    ],
  },
] as const;

async function refreshDemoShelf(
  request: APIRequestContext,
  shelf: (typeof DEMO_SHELVES)[number],
): Promise<void> {
  // Delete any prior copy so re-runs pick up updated seed data instead of
  // accumulating stale shelves.
  const dashboardRes = await request.get('/api/shelf/dashboard');
  const dashboard = await dashboardRes.json();
  for (const s of (dashboard.data?.shelves ?? []).filter(
    (s: { name: string }) => s.name === shelf.name,
  )) {
    await request.delete(`/api/shelf/${s.id}`);
  }

  const createRes = await request.post('/api/shelf/create', {
    data: { name: shelf.name, description: shelf.description },
  });
  const created = (await createRes.json()).data;

  for (const item of shelf.items) {
    await request.post('/api/items', { data: { shelf_id: created.id, ...item } });
  }
}

test('capture dashboard library-view screenshots', async ({ page }) => {
  test.setTimeout(120_000);

  await authenticate(page.request);
  for (const shelf of DEMO_SHELVES) {
    await refreshDemoShelf(page.request, shelf);
  }

  await mkdir(SCREENSHOT_DIR, { recursive: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/dashboard', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'My Shelves' }).waitFor();
  // Let cover images finish loading before capturing.
  await page.waitForTimeout(4000);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'dashboard-library-view.jpg'),
    type: 'jpeg',
    quality: 82,
  });

  // Close-up of a single card to show the "books on a ledge" detail.
  const card = page.getByRole('link', { name: /Engineering Bookshelf/ });
  await card.screenshot({
    path: path.join(SCREENSHOT_DIR, 'dashboard-library-card.jpg'),
    type: 'jpeg',
    quality: 90,
  });

  // Mobile single-column layout.
  await page.setViewportSize({ width: 414, height: 896 });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'dashboard-library-mobile.jpg'),
    type: 'jpeg',
    quality: 82,
  });
});
