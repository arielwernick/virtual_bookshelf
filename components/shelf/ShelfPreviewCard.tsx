'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ShelfPreviewItem } from '@/lib/types/shelf';

/**
 * ShelfPreviewCard - Dashboard card that renders a shelf as a miniature
 * bookshelf: item covers stand like books on a wooden ledge, items without
 * cover art become colored spines showing their title.
 */

export interface ShelfPreviewCardProps {
  shelf: {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    item_count: number;
    preview_items: ShelfPreviewItem[];
  };
}

// Max covers shown standing on the shelf; remaining items collapse into a "+N" spine
const MAX_VISIBLE_BOOKS = 5;

// Spine colors and heights are picked deterministically (no randomness) so
// server and client render identically and cards are stable across refreshes.
const SPINE_COLORS = [
  'bg-rose-800',
  'bg-emerald-800',
  'bg-indigo-800',
  'bg-amber-800',
  'bg-teal-800',
  'bg-violet-800',
];

const BOOK_HEIGHTS = ['h-24', 'h-[5.25rem]', 'h-[5.75rem]', 'h-20', 'h-[5.5rem]'];

function spineColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash + title.charCodeAt(i)) % SPINE_COLORS.length;
  }
  return SPINE_COLORS[hash];
}

function PreviewBook({ item, index }: { item: ShelfPreviewItem; index: number }) {
  const [imageError, setImageError] = useState(false);
  const height = BOOK_HEIGHTS[index % BOOK_HEIGHTS.length];

  if (item.image_url && !imageError) {
    return (
      <div
        className={`relative w-11 ${height} shrink-0 rounded-sm overflow-hidden shadow-md ring-1 ring-black/10 dark:ring-white/10`}
        title={item.title}
      >
        <Image
          src={item.image_url}
          alt={item.title}
          fill
          sizes="44px"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-11 ${height} shrink-0 rounded-sm shadow-md ${spineColor(item.title)} flex items-center justify-center px-1`}
      title={item.title}
    >
      <span className="text-[9px] font-medium text-white/90 [writing-mode:vertical-rl] max-h-full overflow-hidden text-ellipsis whitespace-nowrap leading-none">
        {item.title}
      </span>
    </div>
  );
}

export function ShelfPreviewCard({ shelf }: ShelfPreviewCardProps) {
  const visibleItems = shelf.preview_items.slice(0, MAX_VISIBLE_BOOKS);
  const overflowCount = shelf.item_count - visibleItems.length;

  return (
    <Link
      href={`/shelf/${shelf.id}`}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow block group overflow-hidden"
    >
      {/* Miniature bookshelf */}
      <div className="px-5 pt-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
        <div className="flex items-end justify-center gap-1 h-28">
          {visibleItems.length === 0 ? (
            <span className="self-center text-sm italic text-gray-400 dark:text-gray-500">
              This shelf is empty
            </span>
          ) : (
            <>
              {visibleItems.map((item, index) => (
                <PreviewBook key={item.id} item={item} index={index} />
              ))}
              {overflowCount > 0 && (
                <div className="w-11 h-20 shrink-0 rounded-sm border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  +{overflowCount}
                </div>
              )}
            </>
          )}
        </div>
        {/* Wooden ledge the books stand on */}
        <div className="h-2 rounded-sm bg-gradient-to-b from-amber-700 to-amber-900 dark:from-amber-800 dark:to-amber-950 shadow-[0_3px_5px_rgba(0,0,0,0.25)]" />
      </div>

      {/* Shelf info */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 truncate">
          {shelf.name}
        </h3>
        {shelf.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
            {shelf.description}
          </p>
        )}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <span>
            {shelf.item_count} item{shelf.item_count !== 1 ? 's' : ''}
          </span>
          <span className="text-xs">{shelf.is_public ? '🌍 Public' : '🔒 Private'}</span>
        </div>
      </div>
    </Link>
  );
}
