/**
 * ItemCardStatic - Server-renderable item card for SSR
 *
 * This component renders all item content as static HTML that crawlers
 * and AI assistants can read without JavaScript execution.
 *
 * No 'use client' directive - safe for SSR
 * No onClick handlers - interactivity handled by parent client component
 */

import Link from 'next/link';
import { Item } from '@/lib/types/shelf';
import { getAspectRatio, getAspectRatioNumeric } from '@/lib/constants/aspectRatios';
import { StarDisplayStatic } from '@/components/ui/StarDisplayStatic';
import { ItemCardImage } from './ItemCardImage';
import { CoverPlaceholder } from './CoverPlaceholder';
import { NoteMarker } from './NoteMarker';
import { calculateJitter } from '@/lib/utils/imageUtils';
import { extractVideoId } from '@/lib/api/youtube';
import { getSpotifyEmbed } from '@/lib/utils/spotifyEmbed';
import { SpotifyPlayBadge } from './SpotifyPlayBadge';

interface ItemCardStaticProps {
  item: Item;
  /** Optional: ID to use for click handling via client wrapper */
  'data-item-id'?: string;
  /** Load this card's cover straight away (first cards on the page). */
  priority?: boolean;
}

export function ItemCardStatic({ item, priority = false, ...props }: ItemCardStaticProps) {
  const baseRatioStr = getAspectRatio(item.type);
  const baseRatioNum = getAspectRatioNumeric(item.type);
  const jitter = item.type === 'book' ? calculateJitter(item.id, 0.07) : 0;
  const effectiveImageUrl = item.type === 'stock'
    ? `https://financialmodelingprep.com/image-stock/${encodeURIComponent(item.creator)}.png`
    : item.image_url;
  const adjustedRatioNum = baseRatioNum * (1 + jitter);
  const hasNotes = Boolean(item.notes);
  const isPlayable = getSpotifyEmbed(item) !== null;
  const fallbackCover = <CoverPlaceholder item={item} clearNoteMarker={hasNotes || isPlayable} />;

  // Video items get a crawlable link to their dedicated /v/[videoId] watch
  // page. A plain click still opens the modal (SharedShelfInteractive calls
  // preventDefault); the href exists for crawlers and cmd/middle-click.
  const videoId = item.type === 'video' && item.external_url ? extractVideoId(item.external_url) : null;
  const watchHref = videoId ? `/v/${videoId}` : null;

  const badgeColor = {
    book: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
    podcast: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
    music: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
    podcast_episode: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200',
    video: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
    link: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200',
    stock: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
  };

  return (
    <article
      className="group relative bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
      data-item-id={item.id}
      data-item-type={item.type}
      {...props}
    >
      {/* Image Container */}
      <div
        className={`relative ${item.type === 'stock' ? 'bg-white dark:bg-gray-100' : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'}`}
        style={{ aspectRatio: adjustedRatioNum || baseRatioStr }}
      >
        {/* Item Image, or a placeholder cover when it's missing or fails to load */}
        {effectiveImageUrl ? (
          <ItemCardImage
            src={effectiveImageUrl}
            alt={item.title}
            className={`w-full h-full object-center ${item.type === 'stock' ? 'object-contain' : 'object-cover'}`}
            style={item.type === 'stock' ? { padding: '8%' } : undefined}
            fallback={fallbackCover}
            priority={priority}
          />
        ) : (
          fallbackCover
        )}

        {hasNotes && <NoteMarker />}

        {/* Type Badge */}
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
          <span
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${badgeColor[item.type]}`}
          >
            {item.type}
          </span>
        </div>

        {/* Spotify ▶ - a click opens the item window with the player */}
        {isPlayable && <SpotifyPlayBadge />}

        {/* Crawlable link to the dedicated watch page for video items.
            Overlay so it doesn't disturb card layout; a plain click is
            intercepted by SharedShelfInteractive to open the modal instead. */}
        {watchHref && (
          <Link
            href={watchHref}
            className="absolute inset-0 z-10"
            aria-label={`Watch ${item.title}`}
          />
        )}
      </div>

      {/* Item Metadata - visible to crawlers */}
      <div className="p-2 sm:p-3">
        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-0.5 sm:mb-1">
          {item.title}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
          {item.creator}
        </p>

        {/* Rating display */}
        {item.rating && (
          <div className="mt-0.5 sm:mt-1">
            <StarDisplayStatic rating={item.rating} size="sm" />
          </div>
        )}

        {/* Note teaser - the full note is in the HTML; the popup shows it in full */}
        {hasNotes && (
          <p className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-100 dark:border-gray-800 font-serif italic text-[9px] sm:text-[9.75px] text-gray-700 dark:text-gray-300 line-clamp-2 leading-snug" data-testid="note-preview">
            {item.notes}
          </p>
        )}
      </div>
    </article>
  );
}
