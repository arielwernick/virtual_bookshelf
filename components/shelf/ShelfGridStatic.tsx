/**
 * ShelfGridStatic - Server-rendered shelf grid for the shared /s/ page.
 *
 * Item markup (ItemCardStatic) is rendered into the initial HTML so crawlers
 * and AI can read items without executing JavaScript. The visual row grouping
 * is delegated to ShelfRowsResponsive, a thin client layer that sizes rows to
 * the viewer's width (it falls back to a fixed split before hydration, so the
 * server HTML stays stable). Without that, a row of fixed-width cards wraps
 * onto a second visual line under a single ledge.
 */

import { Item } from '@/lib/types/shelf';
import { ShelfRowsResponsive } from './ShelfRowsResponsive';

interface ShelfGridStaticProps {
  items: Item[];
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

  return <ShelfRowsResponsive items={items} />;
}
