/**
 * ItemCardStatic - Server-renderable item card for SSR
 *
 * This component renders all item content as static HTML that crawlers
 * and AI assistants can read without JavaScript execution.
 *
 * No 'use client' directive - safe for SSR
 * No onClick handlers - interactivity handled by parent client component
 */

import { Item } from '@/lib/types/shelf';
import { getAspectRatio, getAspectRatioNumeric } from '@/lib/constants/aspectRatios';
import { StarDisplayStatic } from '@/components/ui/StarDisplayStatic';
import { calculateJitter } from '@/lib/utils/imageUtils';

interface ItemCardStaticProps {
  item: Item;
  /** Optional: ID to use for click handling via client wrapper */
  'data-item-id'?: string;
}

export function ItemCardStatic({ item, ...props }: ItemCardStaticProps) {
  const baseRatioStr = getAspectRatio(item.type);
  const baseRatioNum = getAspectRatioNumeric(item.type);
  const jitter = item.type === 'book' ? calculateJitter(item.id, 0.07) : 0;
  const adjustedRatioNum = baseRatioNum * (1 + jitter);
  const hasNotes = Boolean(item.notes);

  const badgeColor = {
    book: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
    podcast: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
    music: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
    podcast_episode: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200',
    video: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
    link: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200',
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
        className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
        style={{ aspectRatio: adjustedRatioNum || baseRatioStr }}
      >
        {/* Item Image - using standard img for SSR compatibility */}
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
        )}

        {/* Fallback Icon */}
        {!item.image_url && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
          <span
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${badgeColor[item.type]}`}
          >
            {item.type}
          </span>
        </div>
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

        {/* Note preview */}
        {hasNotes && (
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
              &ldquo;{item.notes}&rdquo;
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
