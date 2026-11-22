/**
 * CoverPlaceholder - a designed stand-in cover for items with no artwork.
 *
 * Shown when an item has no image_url or its image fails to load. Each item
 * gets a muted cover color picked from its title and creator, so the same item
 * looks the same everywhere and a shelf of placeholders still reads as a shelf
 * of distinct things. The title and creator are printed on it, like a plain
 * book jacket. The top is left clear for the card's type badge.
 *
 * No 'use client' directive - safe for SSR. Fills its (relative) parent.
 * Text sizes with the container (cqw units), so it works from a 100px card to
 * the 256px modal cover.
 */

import { Item } from '@/lib/types/shelf';
import { stableHash } from '@/lib/utils/imageUtils';

/** Background + text pairs. Text is the darkest shade of the same hue. */
export const COVER_PALETTE = [
  'bg-amber-200 text-amber-950',
  'bg-stone-300 text-stone-900',
  'bg-orange-300 text-orange-950',
  'bg-teal-200 text-teal-950',
  'bg-violet-200 text-violet-950',
  'bg-rose-200 text-rose-950',
  'bg-sky-200 text-sky-950',
  'bg-emerald-200 text-emerald-950',
] as const;

export function coverColor(title: string, creator?: string | null): string {
  return COVER_PALETTE[stableHash(`${title}|${creator ?? ''}`, COVER_PALETTE.length)];
}

interface CoverPlaceholderProps {
  item: Pick<Item, 'title' | 'creator' | 'type'>;
  className?: string;
  /** Lift the text clear of a NoteMarker in the bottom-right corner. */
  clearNoteMarker?: boolean;
}

export function CoverPlaceholder({ item, className = '', clearNoteMarker = false }: CoverPlaceholderProps) {
  // Stocks show the ticker; episodes show the show's name, which is what
  // their real artwork would show. Everything else is title + creator, like a
  // book jacket.
  const showCreatorOnly = (item.type === 'stock' || item.type === 'podcast_episode') && Boolean(item.creator);
  const heading = showCreatorOnly ? item.creator : item.title;
  const byline = showCreatorOnly ? null : item.creator;

  return (
    <div
      className={`@container absolute inset-0 flex flex-col justify-end overflow-hidden ${coverColor(item.title, item.creator)} ${className}`}
      data-testid="cover-placeholder"
      aria-hidden="true"
    >
      <div className={`px-[8cqw] pt-[24cqw] max-h-full overflow-hidden ${clearNoteMarker ? 'pb-[30cqw]' : 'pb-[8cqw]'}`}>
        <span className="block font-semibold leading-tight text-[11cqw] line-clamp-3 break-words">{heading}</span>
        {byline && (
          <span className="block mt-[3cqw] leading-tight text-[8cqw] opacity-80 line-clamp-2 break-words">{byline}</span>
        )}
      </div>
    </div>
  );
}
