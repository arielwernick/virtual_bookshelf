/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';
import sitemap from './sitemap';
import { GET as getLlmsTxt } from './llms.txt/route';

vi.mock('@/lib/db/queries', () => ({
  getPublicShelves: vi.fn().mockResolvedValue([]),
  getPublicVideoItems: vi.fn().mockResolvedValue([]),
}));

const GUIDE_PATH = '/guides/how-to-add-a-reading-list-to-your-resume';

describe('guides in crawler files', () => {
  it('lists the index and each guide in the sitemap', async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith('/guides'))).toBe(true);
    expect(urls.some((url) => url.endsWith(GUIDE_PATH))).toBe(true);
  });

  it('lists each guide in llms.txt', async () => {
    const body = await getLlmsTxt().text();

    expect(body).toContain('## Guides');
    expect(body).toContain(GUIDE_PATH);
  });
});
