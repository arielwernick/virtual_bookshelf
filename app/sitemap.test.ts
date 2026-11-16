import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db/queries', () => ({
  getPublicShelves: vi.fn().mockResolvedValue([
    { share_token: 'Xk9mP2vL', name: 'Favorite Books', updated_at: new Date('2026-11-01T00:00:00Z') },
  ]),
  getPublicVideoItems: vi.fn().mockResolvedValue([]),
}));

import sitemap from './sitemap';

describe('sitemap', () => {
  it('lists public shelves at their canonical URL', async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith('/s/favorite-books-Xk9mP2vL'))).toBe(true);
  });

  it('lists the paste-a-list page, which works without an account', async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith('/import'))).toBe(true);
  });

  it('lists the books-and-podcasts and app comparison pages', async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith('/books-and-podcasts'))).toBe(true);
    expect(urls.some((url) => url.endsWith('/best-virtual-bookshelf-apps'))).toBe(true);
  });

  it('leaves out sign-in pages, which are not search destinations', async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((url) => /\/(login|signup)$/.test(url))).toBe(false);
  });

  it('lists the Privacy and Terms pages', async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith('/privacy'))).toBe(true);
    expect(urls.some((url) => url.endsWith('/terms'))).toBe(true);
  });

  it('does not stamp the homepage with the current time', async () => {
    const [home] = await sitemap();
    expect(home.lastModified).toBeUndefined();
  });
});
