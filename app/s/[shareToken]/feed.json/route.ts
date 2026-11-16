import { loadPublicShelf, twinHeaders, twinNotFound } from '@/lib/shelf/loadPublicShelf';
import { toJsonFeed, toPublicShelf } from '@/lib/shelf/publicShelf';

/**
 * GET /s/<slug>/feed.json: JSON Feed 1.1, newest item first, so a shelf can be followed.
 * Public shelves only; anything else is a 404 (issue #285).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;
  const loaded = await loadPublicShelf(shareToken);
  if (!loaded) return twinNotFound();

  const doc = toPublicShelf(loaded.shelf, loaded.items);
  return new Response(JSON.stringify(toJsonFeed(doc), null, 2), {
    headers: twinHeaders(loaded.shelf, 'application/feed+json; charset=utf-8'),
  });
}
