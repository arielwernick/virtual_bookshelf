import { loadPublicShelf, twinHeaders, twinNotFound } from '@/lib/shelf/loadPublicShelf';
import { toPublicShelf } from '@/lib/shelf/publicShelf';

/**
 * GET /s/<slug>/shelf.json: the public shelf document (docs/spec/SHELF_FORMAT.md).
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
  return new Response(JSON.stringify(doc, null, 2), {
    headers: twinHeaders(loaded.shelf, 'application/json; charset=utf-8'),
  });
}
