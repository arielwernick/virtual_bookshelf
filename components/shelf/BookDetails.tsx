'use client';

import { useEffect, useState } from 'react';
import type { Item } from '@/lib/types/shelf';
import type { BookDetails } from '@/lib/api/bookDetails';
import { deriveItemIdentity } from '@/lib/utils/itemIdentity';

export type BookDetailsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; details: BookDetails };

/** Query string for /api/books/details, from what the item knows about itself. */
export function bookDetailsQuery(item: Pick<Item, 'type' | 'title' | 'creator' | 'external_url' | 'source' | 'source_id'>): string {
  const identity =
    item.source && item.source_id
      ? { source: item.source, sourceId: item.source_id }
      : deriveItemIdentity(item.type, item.external_url);

  const params = new URLSearchParams({ title: item.title });
  if (item.creator) params.set('author', item.creator);
  if (identity?.source === 'google_books') params.set('googleId', identity.sourceId);
  if (identity?.source === 'open_library') params.set('openLibraryId', identity.sourceId);
  return params.toString();
}

/** Loads book details for the open item; idle for anything that isn't a book. */
export function useBookDetails(item: Item | null): BookDetailsState {
  const query = item?.type === 'book' ? bookDetailsQuery(item) : null;
  const [state, setState] = useState<{ query: string; details: BookDetails } | null>(null);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    fetch(`/api/books/details?${query}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => setState({ query, details: body?.success ? (body.data as BookDetails) : {} }))
      .catch((error: unknown) => {
        if ((error as Error)?.name !== 'AbortError') setState({ query, details: {} });
      });
    return () => controller.abort();
  }, [query]);

  if (!query) return { status: 'idle' };
  if (state?.query !== query) return { status: 'loading' };
  return { status: 'done', details: state.details };
}

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n);
}

/** Year · pages · category line, reader rating, and the blurb. */
export function BookFacts({ state }: { state: BookDetailsState }) {
  const [expanded, setExpanded] = useState(false);

  if (state.status === 'idle') return null;

  if (state.status === 'loading') {
    return (
      <div className="mb-4 sm:mb-6 space-y-2" data-testid="book-facts-loading" aria-hidden="true">
        <div className="h-3.5 w-48 rounded-full bg-gray-200 dark:bg-gray-700 motion-safe:animate-pulse" />
        <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 motion-safe:animate-pulse" />
        <div className="h-3 w-11/12 rounded-full bg-gray-100 dark:bg-gray-800 motion-safe:animate-pulse" />
        <div className="h-3 w-2/3 rounded-full bg-gray-100 dark:bg-gray-800 motion-safe:animate-pulse" />
      </div>
    );
  }

  const { details } = state;
  const facts = [
    details.year ? String(details.year) : null,
    details.pageCount ? `${details.pageCount} pages` : null,
    details.categories?.[0] ?? null,
  ].filter(Boolean);
  const long = (details.description?.length ?? 0) > 280;

  if (!facts.length && !details.rating && !details.description) return null;

  return (
    <div className="mb-4 sm:mb-6" data-testid="book-facts">
      {(facts.length > 0 || details.rating) && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
          {facts.length > 0 && <span>{facts.join(' · ')}</span>}
          {details.rating && (
            <span
              className="inline-flex items-center gap-1"
              title={`Average of ${details.rating.count.toLocaleString()} ratings on ${details.rating.source}`}
            >
              {facts.length > 0 && <span aria-hidden="true">·</span>}
              <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 00-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z" />
              </svg>
              <span>
                {details.rating.average.toFixed(1)}{' '}
                <span className="text-gray-400 dark:text-gray-500">
                  ({formatCount(details.rating.count)} on {details.rating.source})
                </span>
              </span>
            </span>
          )}
        </p>
      )}
      {details.description && (
        <div>
          <p
            className={`text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line ${long && !expanded ? 'line-clamp-4' : ''}`}
            data-testid="book-description"
          >
            {details.description}
          </p>
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 underline underline-offset-2 hover:no-underline"
              aria-expanded={expanded}
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Google Books' in-page preview. Google's viewer paints an opaque page once
 * ready; the message underneath shows until then.
 */
export function BookPreview({ volumeId, title }: { volumeId: string; title: string }) {
  return (
    <div className="relative mt-4 sm:mt-6 w-full h-[420px] sm:h-[560px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400" aria-hidden="true">
        Loading preview…
      </div>
      <iframe
        src={`https://books.google.com/books?id=${encodeURIComponent(volumeId)}&pg=PP1&output=embed`}
        title={`Preview of ${title}`}
        className="absolute inset-0 w-full h-full border-0"
        data-testid="book-preview"
      />
    </div>
  );
}
