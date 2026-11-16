'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getDomain } from '@/lib/utils/urlResolver';
import {
  MOBILE_BREAKPOINT,
  SSR_SAFE_ITEMS_PER_ROW,
  computeItemsPerRow,
} from '@/lib/utils/shelfLayout';
import { PreviewItem, getPreviewTitle } from './ParsedItemPreview';

// Measure before paint so the rows never visibly re-split; React warns about
// useLayoutEffect during SSR, so fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface ImportShelfPreviewProps {
  items: PreviewItem[];
  /** Called with the item's index in `items` */
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  /** True while covers are still being fetched: cards can't be edited yet */
  busy?: boolean;
}

interface IndexedItem {
  item: PreviewItem;
  index: number;
}

/**
 * The pasted list drawn the way a saved shelf looks: cover cards standing on
 * a wooden ledge, one ledge per row. Mirrors ShelfRow in ShelfGrid so the
 * preview and the real shelf read as the same thing.
 */
export function ImportShelfPreview({ items, onRemove, onEdit, busy = false }: ImportShelfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemsPerRow, setItemsPerRow] = useState(SSR_SAFE_ITEMS_PER_ROW);

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      // Not laid out yet (hidden, or no layout engine): keep the current split
      if (el.clientWidth === 0) return;
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      const next = computeItemsPerRow(el.clientWidth, isMobile);
      setItemsPerRow((prev) => (prev === next ? prev : next));
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onShelf: IndexedItem[] = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.selected);

  const perRow = Math.max(1, itemsPerRow);
  const rows: IndexedItem[][] = [];
  for (let i = 0; i < onShelf.length; i += perRow) {
    rows.push(onShelf.slice(i, i + perRow));
  }

  return (
    <div ref={containerRef} className="space-y-4" data-testid="import-shelf-preview">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden"
        >
          <ul
            className="px-3 py-3 sm:px-6 sm:py-5 flex flex-wrap"
            style={{ gap: '0.5rem', alignItems: 'flex-end' }}
          >
            {row.map(({ item, index }) => (
              <li key={item.url} className="w-[100px] sm:w-[140px] flex-shrink-0">
                <ShelfPreviewCard
                  item={item}
                  busy={busy}
                  onRemove={() => onRemove(index)}
                  onEdit={() => onEdit(index)}
                />
              </li>
            ))}
          </ul>
          <div
            className="h-1.5 sm:h-2 bg-gradient-to-r from-warm-brown via-muted-gold to-warm-brown"
            style={{
              boxShadow:
                '0 8px 16px rgba(139, 95, 71, 0.4), 0 4px 8px rgba(139, 95, 71, 0.3), inset 0 1px 0 rgba(212, 146, 26, 0.2)',
            }}
          />
        </div>
      ))}
    </div>
  );
}

interface ShelfPreviewCardProps {
  item: PreviewItem;
  busy: boolean;
  onRemove: () => void;
  onEdit: () => void;
}

function ShelfPreviewCard({ item, busy, onRemove, onEdit }: ShelfPreviewCardProps) {
  const [imageError, setImageError] = useState(false);
  const domain = getDomain(item.resolvedUrl || item.url);
  const title = getPreviewTitle(item);
  const note = item.parsedDescription?.trim();
  const showImage = Boolean(item.fetchedImage) && !imageError;

  return (
    <div className="group relative bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-offset-2">
      <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
        {item.loading ? (
          <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
        ) : showImage ? (
          <Image
            src={item.fetchedImage as string}
            alt=""
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100px, 140px"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 text-center break-words line-clamp-3">
              {domain}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${title}`}
          title="Remove from shelf"
          className="absolute top-1 left-1 sm:top-2 sm:left-2 p-1.5 rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 shadow-sm hover:bg-white dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={onEdit}
        disabled={busy}
        aria-label={`Edit ${title}`}
        className="block w-full text-left p-2 sm:p-3 focus:outline-none disabled:cursor-default"
      >
        <span className="block font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-0.5 sm:mb-1">
          {title}
        </span>
        <span className="block text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
          {domain}
        </span>
        <span className="flex items-start gap-1.5 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-100 dark:border-gray-800">
          <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span
            className={`text-[10px] sm:text-xs line-clamp-2 leading-relaxed ${
              note ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500 italic'
            }`}
          >
            {note || 'Add a note'}
          </span>
        </span>
      </button>
    </div>
  );
}
