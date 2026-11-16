import { describe, it, expect } from 'vitest';
import { buildGrowthLink, EMBED_BADGE_LINK, SHARED_SHELF_CTA_LINK } from './growthLinks';
import { buildAttributionCookieValue, parseAttributionCookie } from './attribution';

describe('growth links', () => {
  it('tags the embed badge and the shared shelf call to action', () => {
    expect(EMBED_BADGE_LINK).toBe('/?utm_source=embed&utm_medium=badge');
    expect(SHARED_SHELF_CTA_LINK).toBe('/signup?utm_source=shared_shelf&utm_medium=cta');
  });

  it('builds relative links only', () => {
    expect(buildGrowthLink('/signup', 'embed', 'cta').startsWith('/signup?')).toBe(true);
  });

  it('is read back by signup attribution', () => {
    const cookie = buildAttributionCookieValue(
      `https://virtualbookshelf.app${EMBED_BADGE_LINK}`,
      'https://someblog.example/reading'
    );
    const attribution = parseAttributionCookie(cookie);

    expect(attribution?.utmSource).toBe('embed');
    expect(attribution?.utmMedium).toBe('badge');
  });
});
