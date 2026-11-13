import { describe, it, expect } from 'vitest';
import robots, { AI_SEARCH_CRAWLERS } from './robots';

describe('robots', () => {
  const rules = robots().rules as Array<{
    userAgent: string | string[];
    allow: string[];
    disallow: string[];
  }>;

  it('lets crawlers fetch share-card images while keeping the API private', () => {
    for (const rule of rules) {
      expect(rule.allow).toContain('/api/og/');
      expect(rule.disallow).toEqual(expect.arrayContaining(['/api/', '/dashboard', '/embed/']));
    }
  });

  it('names the AI search and answer crawlers explicitly', () => {
    const named = rules.flatMap((rule) => rule.userAgent);
    for (const bot of AI_SEARCH_CRAWLERS) expect(named).toContain(bot);
  });

  it('points to the sitemap', () => {
    expect(robots().sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
