'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ItemType, ShelfPreviewItem } from '@/lib/types/shelf';
import { stableHash } from '@/lib/utils/imageUtils';

/**
 * ShelfPreviewCard - Dashboard card that renders a shelf as a miniature
 * media shelf. Items stand bottom-aligned on a wooden ledge. Books show as
 * narrow portrait spines; all other media (podcast / music / podcast_episode /
 * stock / video / link) show as uniform square tiles so artwork isn't
 * distorted. Items without art become colored tiles showing the title.
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

// Total tiles on the shelf never exceeds this, so wide rows can't overflow the
// card. When there are more items, the last slot becomes a "+N" marker.
const MAX_VISIBLE = 5;

// Tile footprint (px). Widths are small enough that 5 fit across the narrowest
// 3-column card.
const SPINE = { width: 40, height: 60 };
const SQUARE = { width: 48, height: 48 };

const SPINE_COLORS = [
  'bg-rose-800',
  'bg-emerald-800',
  'bg-indigo-800',
  'bg-amber-800',
  'bg-teal-800',
  'bg-violet-800',
];

function spineColor(seed: string): string {
  return SPINE_COLORS[stableHash(seed, SPINE_COLORS.length)];
}

// Stock logos are derived from the ticker (creator) at display time, like ItemCard.
function tileImageUrl(item: ShelfPreviewItem): string | null {
  if (item.type === 'stock') {
    return `https://financialmodelingprep.com/image-stock/${encodeURIComponent(item.creator)}.png`;
  }
  return item.image_url;
}

function PreviewTile({ item, index }: { item: ShelfPreviewItem; index: number }) {
  const [imageError, setImageError] = useState(false);

  const isBook = item.type === 'book';
  const base = isBook ? SPINE : SQUARE;
  // Subtle, stable height variation for books gives the row an organic line.
  const jitter = isBook ? stableHash(`${item.id}-${index}`, 7) - 3 : 0;
  const width = base.width;
  const height = base.height + jitter;

  const src = tileImageUrl(item);
  const isLogo = item.type === 'stock';

  if (src && !imageError) {
    return (
      <div
        className={`relative shrink-0 rounded-sm overflow-hidden shadow-md ring-1 ring-black/10 dark:ring-white/10 ${
          isLogo
            ? 'bg-white'
            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'
        }`}
        style={{ width, height }}
        title={item.title}
      >
        <Image
          src={src}
          alt={item.title}
          fill
          sizes="48px"
          className={isLogo ? 'object-contain p-1' : 'object-cover'}
          unoptimized={isLogo}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  const label = isLogo ? item.creator : item.title;
  return (
    <div
      className={`shrink-0 rounded-sm shadow-md flex items-center justify-center overflow-hidden ${spineColor(item.title)}`}
      style={{ width, height }}
      title={item.title}
    >
      <span
        className={
          isBook
            ? 'text-[9px] font-medium text-white/90 [writing-mode:vertical-rl] max-h-full overflow-hidden text-ellipsis whitespace-nowrap leading-none'
            : 'text-[8px] font-medium text-white/90 text-center px-1 leading-tight line-clamp-3'
        }
      >
        {label}
      </span>
    </div>
  );
}

export function ShelfPreviewCard({ shelf }: ShelfPreviewCardProps) {
  const hasOverflow = shelf.item_count > MAX_VISIBLE;
  const visibleCount = hasOverflow ? MAX_VISIBLE - 1 : shelf.item_count;
  const visibleItems = shelf.preview_items.slice(0, visibleCount);
  const overflowCount = shelf.item_count - visibleItems.length;

  return (
    <Link
      href={`/shelf/${shelf.id}`}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow block group overflow-hidden"
    >
      {/* Miniature media shelf */}
      <div className="px-5 pt-5 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
        <div className="flex items-end justify-center gap-1 h-16">
          {visibleItems.length === 0 ? (
            <span className="self-center text-sm italic text-gray-400 dark:text-gray-500">
              This shelf is empty
            </span>
          ) : (
            <>
              {visibleItems.map((item, index) => (
                <PreviewTile key={item.id} item={item} index={index} />
              ))}
              {overflowCount > 0 && (
                <div
                  className="shrink-0 rounded-sm border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
                  style={{ width: SQUARE.width, height: SQUARE.height }}
                >
                  +{overflowCount}
                </div>
              )}
            </>
          )}
        </div>
        {/* Shelf ledge — matches the OG image generator (stone gradient) */}
        <div className="h-2.5 rounded-sm bg-gradient-to-b from-stone-500 via-stone-600 to-stone-700 shadow-[0_4px_8px_rgba(0,0,0,0.2)]" />
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
