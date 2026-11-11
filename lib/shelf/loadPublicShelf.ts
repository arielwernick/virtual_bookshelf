import { getShelfByShareToken, getItemsByShelfId } from '@/lib/db/queries';
import { extractShareToken } from '@/lib/utils/slug';
import { Item, Shelf } from '@/lib/types/shelf';
import { buildShelfUrls } from './publicShelf';

/**
 * Load a shelf for a public, unauthenticated surface.
 *
 * Returns null unless the shelf exists and is public, so callers answer 404
 * for both cases and never reveal that a private shelf exists. This is the
 * one place the visibility rule for machine-readable views lives; when the
 * three visibility levels land (#263) change it here.
 *
 * The route param may be a bare token or "<name-slug>-<token>".
 */
export async function loadPublicShelf(
  param: string
): Promise<{ shelf: Shelf; items: Item[] } | null> {
  const token = extractShareToken(param);
  let shelf = await getShelfByShareToken(token);
  if (!shelf && token !== param) {
    // Legacy tokens that themselves contain a hyphen
    shelf = await getShelfByShareToken(param);
  }
  if (!shelf || !shelf.is_public) return null;

  const items = await getItemsByShelfId(shelf.id);
  return { shelf, items };
}

/**
 * Headers shared by the machine-readable twins of a shelf page.
 *
 * The HTML page stays the one search engines index: each twin names it as
 * canonical and asks not to be indexed itself. Cached at the CDN like the
 * embed API.
 */
export function twinHeaders(shelf: Shelf, contentType: string): HeadersInit {
  const { html } = buildShelfUrls(shelf.name, shelf.share_token);
  return {
    'Content-Type': contentType,
    Link: `<${html}>; rel="canonical"`,
    'X-Robots-Tag': 'noindex',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  };
}

export function twinNotFound(): Response {
  return new Response('Shelf not found\n', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  });
}
