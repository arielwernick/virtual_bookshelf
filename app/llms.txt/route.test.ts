import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/queries', () => ({
  getPublicShelves: vi.fn(),
}));

import { getPublicShelves } from '@/lib/db/queries';
import { GET, buildLlmsTxt } from './route';

const BASE = 'https://virtualbookshelf.app';
const shelf = { share_token: 'Xk9mP2vL', name: 'Favorite Books', updated_at: new Date('2026-11-01T00:00:00Z') };

describe('buildLlmsTxt', () => {
  it('links each public shelf to its Markdown version', () => {
    const text = buildLlmsTxt(BASE, [shelf]);
    expect(text).toContain(`- [Favorite Books](${BASE}/s/favorite-books-Xk9mP2vL/shelf.md): updated 2026-11-01`);
  });

  it('omits the shelf section when there are none', () => {
    expect(buildLlmsTxt(BASE, [])).not.toContain('## Public shelves');
  });

  it('keeps shelf names from breaking the link syntax', () => {
    const text = buildLlmsTxt(BASE, [{ ...shelf, name: 'Bad](http://evil) [name' }]);
    expect(text).not.toContain('](http://evil)');
  });

  it('matches the settled positioning', () => {
    const text = buildLlmsTxt(BASE, [shelf]);
    expect(text).not.toMatch(/link-in-bio/i);
    expect(text).not.toMatch(/popular alternative/i);
    expect(text).toContain('Shelves start private');
  });

  it('caps the list', () => {
    const many = Array.from({ length: 150 }, (_, i) => ({ ...shelf, share_token: `tok${i}` }));
    expect(buildLlmsTxt(BASE, many).match(/shelf\.md\)/g)).toHaveLength(100);
  });
});

describe('GET /llms.txt', () => {
  beforeEach(() => {
    vi.mocked(getPublicShelves).mockReset();
  });

  it('serves plain text with the shelf list', async () => {
    vi.mocked(getPublicShelves).mockResolvedValue([shelf]);
    const res = await GET();

    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(await res.text()).toContain('Favorite Books');
  });

  it('still serves the file when the database is down', async () => {
    vi.mocked(getPublicShelves).mockRejectedValue(new Error('db down'));
    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.text()).toContain('# Virtual Bookshelf');
  });
});
