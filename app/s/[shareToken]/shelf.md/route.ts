import { loadPublicShelf, twinHeaders, twinNotFound } from '@/lib/shelf/loadPublicShelf';
import { toMarkdown, toPublicShelf } from '@/lib/shelf/publicShelf';

/**
 * GET /s/<slug>/shelf.md: the shelf as plain Markdown, for AI assistants and people.
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
  return new Response(toMarkdown(doc), {
    headers: twinHeaders(loaded.shelf, 'text/markdown; charset=utf-8'),
  });
}
