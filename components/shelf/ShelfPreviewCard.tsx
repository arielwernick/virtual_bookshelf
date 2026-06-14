'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ShelfPreviewItem } from '@/lib/types/shelf';
import { stableHash } from '@/lib/utils/imageUtils';
import { VisibilityBadge } from '@/components/ui/VisibilityBadge';

/**
 * ShelfPreviewCard - Dashboard card that renders a shelf as a miniature
 * media shelf. Items stand bottom-aligned on a wooden ledge and flex to fill
 * the card width, so the shelf always looks full regardless of item count.
 * Books show as portrait (2:3) covers; all other media (podcast / music /
 * podcast_episode / stock / video / link) show as squares so artwork isn't
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

// Total tiles on the shelf never exceeds this; extra items collapse into "+N".
const MAX_VISIBLE = 5;

// Per-shape geometry. Tiles flex to fill the row but never exceed maxWidth.
const BOOK = { aspect: '2 / 3', maxWidth: 54 };
const SQUARE = { aspect: '1 / 1', maxWidth: 62 };

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

function PreviewTile({ item }: { item: ShelfPreviewItem }) {
  const [imageError, setImageError] = useState(false);

  const isBook = item.type === 'book';
  const isLogo = item.type === 'stock';
  const shape = isBook ? BOOK : SQUARE;
  const style: React.CSSProperties = {
    flex: '1 1 0',
    maxWidth: shape.maxWidth,
    aspectRatio: shape.aspect,
  };

  const src = tileImageUrl(item);

  if (src && !imageError) {
    return (
      <div
        className={`relative min-w-0 self-end rounded-sm overflow-hidden shadow-sm ring-1 ring-black/10 dark:ring-white/10 ${
          isLogo
            ? 'bg-white'
            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'
        }`}
        style={style}
        title={item.title}
      >
        <Image
          src={src}
          alt={item.title}
          fill
          sizes="64px"
          className={isLogo ? 'object-contain p-1.5' : 'object-cover'}
          unoptimized={isLogo}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  const label = isLogo ? item.creator : item.title;
  return (
    <div
      className={`min-w-0 self-end rounded-sm shadow-sm flex items-center justify-center overflow-hidden ${spineColor(item.title)}`}
      style={style}
      title={item.title}
    >
      <span
        className={
          isBook
            ? 'text-[9px] font-medium text-white/90 [writing-mode:vertical-rl] max-h-full overflow-hidden text-ellipsis whitespace-nowrap leading-none'
            : 'text-[9px] font-medium text-white/90 text-center px-1 leading-tight line-clamp-3'
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
      <div className="pt-6 bg-gradient-to-b from-stone-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="flex items-end justify-center gap-2 px-5 min-h-[92px]">
          {visibleItems.length === 0 ? (
            <span className="self-center text-sm italic text-gray-400 dark:text-gray-500">
              This shelf is empty
            </span>
          ) : (
            <>
              {visibleItems.map((item) => (
                <PreviewTile key={item.id} item={item} />
              ))}
              {overflowCount > 0 && (
                <div
                  className="min-w-0 self-end rounded-sm border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
                  style={{ flex: '1 1 0', maxWidth: SQUARE.maxWidth, aspectRatio: SQUARE.aspect }}
                >
                  +{overflowCount}
                </div>
              )}
            </>
          )}
        </div>
        {/* Shelf ledge — matches the shelf page ledge (ShelfGrid), full width.
            Negative margin lets items rest on the lip instead of floating. */}
        <div
          className="-mt-0.5 h-2 bg-gradient-to-r from-warm-brown via-muted-gold to-warm-brown"
          style={{
            boxShadow:
              '0 8px 16px rgba(139, 95, 71, 0.4), 0 4px 8px rgba(139, 95, 71, 0.3), inset 0 1px 0 rgba(212, 146, 26, 0.2)',
          }}
        />
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
          <VisibilityBadge isPublic={shelf.is_public} />
        </div>
      </div>
    </Link>
  );
}
