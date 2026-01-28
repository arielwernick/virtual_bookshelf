/**
 * ShelfGridStatic - Server-renderable shelf grid for SSR
 *
 * Renders items in a visual "bookshelf" layout without client-side JavaScript.
 * Simpler than ShelfGrid - no drag-and-drop, no dynamic resize calculations.
 *
 * No 'use client' directive - safe for SSR
 */

import { Item } from '@/lib/types/shelf';
import { ItemCardStatic } from './ItemCardStatic';

interface ShelfGridStaticProps {
  items: Item[];
}

/**
 * ShelfRowStatic - A single shelf displaying items with a visual divider
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

/**
 * Split items into rows for static rendering
 * Uses a simple calculation based on estimated container width
 */
function splitIntoRows(items: Item[], itemsPerRow: number = 6): Item[][] {
  const rows: Item[][] = [];
  for (let i = 0; i < items.length; i += itemsPerRow) {
    rows.push(items.slice(i, i + itemsPerRow));
  }
  return rows;
}

export function ShelfGridStatic({ items }: ShelfGridStaticProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <p className="text-sm">No items in this shelf yet</p>
        </div>
      </div>
    );
  }

  // Split into rows - use responsive estimation
  // On SSR, we don't know exact viewport, so use a reasonable default
  // The flex-wrap will naturally handle overflow on smaller screens
  const rows = splitIntoRows(items, 8);

  return (
    <div className="space-y-4" role="list" aria-label="Bookshelf items">
      {rows.map((rowItems, index) => (
        <ShelfRowStatic key={index} items={rowItems} />
      ))}
    </div>
  );
}
