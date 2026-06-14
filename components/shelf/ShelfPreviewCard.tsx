'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ItemType, ShelfPreviewItem } from '@/lib/types/shelf';
import { stableHash, getImageFitMode } from '@/lib/utils/imageUtils';

/**
 * ShelfPreviewCard - Dashboard card that renders a shelf as a miniature
 * media shelf. Items stand bottom-aligned on a wooden ledge, each shaped by
 * its type so nothing is force-cropped into a book outline:
 *   - book                              -> tall portrait spine
 *   - podcast / music / podcast_episode -> square (album / artwork)
 *   - stock                             -> square logo (contain, on white)
 *   - video / link                      -> 16:9 landscape tile
 * Items without usable art become colored tiles of the same shape showing the
 * title. Shape geometry mirrors lib/constants/aspectRatios.ts.
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

// Max tiles shown standing on the shelf; remaining items collapse into a "+N" spine.
const MAX_VISIBLE = 5;

type TileShape = 'spine' | 'square' | 'wide';

function shapeForType(type: ItemType): TileShape {
  switch (type) {
    case 'book':
      return 'spine';
    case 'video':
    case 'link':
      return 'wide';
    default: // podcast, music, podcast_episode, stock
      return 'square';
  }
}

// Tile footprint per shape (px). Widths stay <= 64 so five fit across a card.
const SHAPE_SIZE: Record<TileShape, { width: number; height: number }> = {
  spine: { width: 40, height: 84 },
  square: { width: 56, height: 56 },
  wide: { width: 64, height: 36 },
};

// Deterministic spine colors (no randomness, so SSR and client agree).
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

/**
 * Resolve the image to display. Stock logos are derived from the ticker
 * (creator) at display time, matching ItemCard.
 */
function tileImageUrl(item: ShelfPreviewItem): string | null {
  if (item.type === 'stock') {
    return `https://financialmodelingprep.com/image-stock/${encodeURIComponent(item.creator)}.png`;
  }
  return item.image_url;
}

function PreviewTile({ item, index }: { item: ShelfPreviewItem; index: number }) {
  const [imageError, setImageError] = useState(false);
  const [fit, setFit] = useState<'cover' | 'contain'>('cover');

  const shape = shapeForType(item.type);
  const { width, height } = SHAPE_SIZE[shape];
  // Subtle, stable height variation for books gives the row an organic line.
  const jitter = shape === 'spine' ? stableHash(`${item.id}-${index}`, 13) - 6 : 0;
  const tileHeight = height + jitter;

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
        style={{ width, height: tileHeight }}
        title={item.title}
      >
        <Image
          src={src}
          alt={item.title}
          fill
          sizes="64px"
          className={isLogo ? 'object-contain p-1' : fit === 'cover' ? 'object-cover' : 'object-contain'}
          unoptimized={isLogo}
          onLoadingComplete={(img) => {
            // Logos always contain; for everything else switch to contain when
            // the art's natural ratio is far from the tile (e.g. a square
            // favicon in a wide link tile) so it isn't cropped.
            if (isLogo) return;
            try {
              setFit(getImageFitMode(img.naturalWidth, img.naturalHeight, width / tileHeight));
            } catch {
              setFit('cover');
            }
          }}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback: colored tile of the same shape, labelled with the title (or
  // ticker for stocks). Spines read vertically; square/wide tiles read across.
  const label = item.type === 'stock' ? item.creator : item.title;
  return (
    <div
      className={`shrink-0 rounded-sm shadow-md flex items-center justify-center overflow-hidden ${spineColor(item.title)}`}
      style={{ width, height: tileHeight }}
      title={item.title}
    >
      <span
        className={
          shape === 'spine'
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
  const visibleItems = shelf.preview_items.slice(0, MAX_VISIBLE);
  const overflowCount = shelf.item_count - visibleItems.length;

  return (
    <Link
      href={`/shelf/${shelf.id}`}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow block group overflow-hidden"
    >
      {/* Miniature media shelf */}
      <div className="px-5 pt-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
        <div className="flex items-end justify-center gap-1.5 h-28">
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
                  style={{ width: 40, height: 52 }}
                >
                  +{overflowCount}
                </div>
              )}
            </>
          )}
        </div>
        {/* Wooden ledge the items stand on */}
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
