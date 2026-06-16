'use client';

import { Item } from '@/lib/types/shelf';
import Image from 'next/image';
import Link from 'next/link';

interface DemoShelfProps {
  items: Item[];
  shelfName: string;
  shareToken: string;
}

// Stock items derive their logo from the ticker (creator) at render time —
// their image_url is null. Mirrors ItemCardStatic / ShelfPreviewCard.
function itemImageUrl(item: Item): string | null {
  if (item.type === 'stock') {
    return `https://financialmodelingprep.com/image-stock/${encodeURIComponent(item.creator)}.png`;
  }
  return item.image_url;
}

/**
 * A simplified shelf display for the home page demo
 * Clickable to view the full demo shelf
 */
export function DemoShelf({ items, shelfName, shareToken }: DemoShelfProps) {
  // Preview a single row; the full shelf lives behind "Click to explore".
  const displayItems = items.slice(0, 8);
  const shelfUrl = `/s/${shareToken}`;

  return (
    <div>
      {/* Clickable shelf preview */}
      <Link
        href={shelfUrl}
        className="block bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
      >
        {/* Shelf header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{shelfName}</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
            Click to explore →
          </span>
        </div>

        {/* Shelf items — a single row that clips (never wraps), so a full
            shelf can't spill onto a second visual line under one ledge. */}
        <div className="relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div
            className="px-4 py-4 flex gap-3 overflow-hidden"
            style={{ alignItems: 'flex-end' }}
          >
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-[80px] sm:w-[100px] group-hover:scale-[1.02] transition-transform"
              >
                <div className={`relative aspect-[2/3] rounded overflow-hidden shadow-md ${item.type === 'stock' ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {itemImageUrl(item) ? (
                    <Image
                      src={itemImageUrl(item)!}
                      alt={item.title}
                      fill
                      sizes="100px"
                      className={item.type === 'stock' ? 'object-contain p-2' : 'object-cover'}
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500 text-center line-clamp-3">
                        {item.title}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Soft right-edge fade hints more items live on the full shelf. */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-1.5 w-12 bg-gradient-to-l from-white dark:from-gray-900 to-transparent" />

          {/* Shelf divider */}
          <div
            className="h-1.5 bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600"
            style={{
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.35), 0 4px 8px rgba(0, 0, 0, 0.25)',
            }}
          />
        </div>
      </Link>

      {/* View full link */}
      <div className="mt-3 text-center">
        <Link
          href={shelfUrl}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
        >
          View full example shelf →
        </Link>
      </div>
    </div>
  );
}
