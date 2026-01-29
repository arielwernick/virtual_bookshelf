'use client';

import Image from 'next/image';
import { getDomain } from '@/lib/utils/urlResolver';

export interface PreviewItem {
  url: string;
  resolvedUrl?: string;
  parsedTitle?: string;
  parsedDescription?: string;
  fetchedTitle?: string;
  fetchedImage?: string;
  fetchedPublisher?: string;
  selected: boolean;
  loading?: boolean;
  error?: string;
}

interface ParsedItemPreviewProps {
  item: PreviewItem;
  index: number;
  onToggle: (index: number) => void;
}

export function ParsedItemPreview({ item, index, onToggle }: ParsedItemPreviewProps) {
  const displayUrl = item.resolvedUrl || item.url;
  const domain = getDomain(displayUrl);
  
  // Use fetched title > parsed title > domain
  const title = item.fetchedTitle || item.parsedTitle || domain;
  
  // Description from parsed context
  const description = item.parsedDescription;

  return (
    <div
      className={`
        relative flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer
        ${item.selected
          ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-60'
        }
        ${item.loading ? 'animate-pulse' : ''}
        hover:border-amber-500/70
      `}
      onClick={() => onToggle(index)}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 pt-0.5">
        <input
          type="checkbox"
          checked={item.selected}
          onChange={() => onToggle(index)}
          className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Image */}
      {item.fetchedImage && (
        <div className="flex-shrink-0 relative w-16 h-16">
          <Image
            src={item.fetchedImage}
            alt=""
            fill
            className="object-cover rounded"
            sizes="64px"
            unoptimized // External URLs may not be in next.config domains
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">
          {title}
        </h4>
        
        {description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {description}
          </p>
        )}
        
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500 truncate">
          → {domain}
        </p>

        {item.error && (
          <p className="mt-1 text-xs text-red-500">
            {item.error}
          </p>
        )}
      </div>

      {/* Loading indicator */}
      {item.loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 rounded-lg flex items-center justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
