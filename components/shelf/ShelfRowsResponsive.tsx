'use client';

import { useRef } from 'react';
import { Item } from '@/lib/types/shelf';
import { ItemCardStatic } from './ItemCardStatic';
import { useShelfRows } from '@/lib/hooks/useShelfRows';

/**
 * ShelfRowsResponsive - client row layer for the shared (SSR) shelf.
 *
 * The shared /s/ page renders item markup with ItemCardStatic on the server so
 * crawlers/AI can read it without JS (the <article data-item-id> nodes are in
 * the initial HTML). How many items fit on a visual row, however, depends on
 * the viewer's width — which the server can't know — so the row grouping is
 * done here on the client via useShelfRows. Before hydration it falls back to a
 * fixed split (matching the server render, so hydration is stable), then
 * re-measures and re-chunks. ItemCardStatic stays the renderer, so the existing
 * data-item-id click delegation in SharedShelfInteractive keeps working.
 */
function ShelfRowStatic({ items }: { items: Item[] }) {
  return (
    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
      <div
        className="px-3 py-3 sm:px-6 sm:py-5 flex flex-wrap"
        style={{
          gap: '0.5rem',
          alignItems: 'flex-end',
        }}
      >
        {items.map((item) => (
          <div key={item.id} className="w-[100px] sm:w-[140px] flex-shrink-0">
            <ItemCardStatic item={item} />
          </div>
        ))}
      </div>
      {/* Shelf divider - the wooden "shelf" visual */}
      <div
        className="h-1.5 sm:h-2 bg-gradient-to-r from-warm-brown via-muted-gold to-warm-brown"
        style={{
          boxShadow:
            '0 8px 16px rgba(139, 95, 71, 0.4), 0 4px 8px rgba(139, 95, 71, 0.3), inset 0 1px 0 rgba(212, 146, 26, 0.2)',
        }}
      />
    </div>
  );
}

export function ShelfRowsResponsive({ items }: { items: Item[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rows = useShelfRows(items, containerRef);

  return (
    <div ref={containerRef} className="space-y-4" role="list" aria-label="Bookshelf items">
      {rows.map((rowItems, index) => (
        <ShelfRowStatic key={index} items={rowItems} />
      ))}
    </div>
  );
}
