'use client';

import { Item } from '@/lib/types/shelf';
import Image from 'next/image';
import Link from 'next/link';

interface DemoShelfProps {
  items: Item[];
  shelfName: string;
  shareToken: string;
}

/**
 * A simplified shelf display for the home page demo
 * Clickable to view the full demo shelf
 */
export function DemoShelf({ items, shelfName, shareToken }: DemoShelfProps) {
  // Limit to 6 items for the demo to keep it clean
  const displayItems = items.slice(0, 6);
  const shelfUrl = `/s/${shareToken}`;

  return (
    <div>
      {/* Clickable shelf preview */}
      <Link
        href={shelfUrl}
        className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
      >
        {/* Shelf header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">{shelfName}</h3>
          <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
            Click to explore →
          </span>
        </div>

        {/* Shelf items */}
        <div className="bg-white/50 backdrop-blur-sm">
          <div
            className="px-4 py-4 flex gap-3 overflow-x-auto"
            style={{ alignItems: 'flex-end' }}
          >
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-[80px] sm:w-[100px] group-hover:scale-[1.02] transition-transform"
              >
                <div className="relative aspect-[2/3] rounded overflow-hidden bg-gray-100 shadow-md">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      sizes="100px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <span className="text-xs text-gray-400 text-center line-clamp-3">
                        {item.title}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Shelf divider */}
          <div
            className="h-1.5 bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400"
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
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          View full example shelf →
        </Link>
      </div>
    </div>
  );
}
