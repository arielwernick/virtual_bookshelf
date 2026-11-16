/**
 * Tracked links for the growth loop: someone sees a shelf on another site or
 * through a shared link, and starts their own (issue #287).
 *
 * The UTM values are read on landing by lib/utils/attribution.ts and stored
 * on the user at signup, so /admin shows how many signups each surface
 * brings in. Keep the values here so they stay consistent.
 *
 * Never put a share token in a UTM value: a link-only token is a secret, and
 * UTM values are stored on the user who signs up.
 *
 * The "Powered by" footer on shared shelf pages is deliberately left as a
 * plain link to "/": it is a crawlable internal link to the homepage, and a
 * tagged URL there would give crawlers a second address for the same page.
 */

export type GrowthSurface = 'embed' | 'shared_shelf';
export type GrowthPlacement = 'badge' | 'cta';

export function buildGrowthLink(
  path: '/' | '/signup',
  surface: GrowthSurface,
  placement: GrowthPlacement
): string {
  const params = new URLSearchParams({ utm_source: surface, utm_medium: placement });
  return `${path}?${params.toString()}`;
}

/** The badge under every embedded shelf. Opens the homepage in a new tab. */
export const EMBED_BADGE_LINK = buildGrowthLink('/', 'embed', 'badge');

/** The "Create My Own Shelf" button under a shared shelf. */
export const SHARED_SHELF_CTA_LINK = buildGrowthLink('/signup', 'shared_shelf', 'cta');
