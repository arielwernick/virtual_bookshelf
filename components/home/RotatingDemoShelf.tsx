'use client';

import { useState, useEffect, useCallback } from 'react';
import { Item, Shelf } from '@/lib/types/shelf';
import Image from 'next/image';
import Link from 'next/link';

export interface ShelfPreview {
  shelf: Shelf;
  items: Item[];
}

interface RotatingDemoShelfProps {
  shelves: ShelfPreview[];
  autoRotateInterval?: number; // ms, default 3000
}

/**
 * A rotating carousel of shelf previews for the home page
 * Shows one shelf at a time with smooth transitions and navigation
 */
export function RotatingDemoShelf({ 
  shelves, 
  autoRotateInterval = 3000 
}: RotatingDemoShelfProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const shelfCount = shelves.length;

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % shelfCount);
  }, [shelfCount]);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + shelfCount) % shelfCount);
  }, [shelfCount]);

  const goToIndex = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Auto-rotate effect
  useEffect(() => {
    if (isPaused || shelfCount <= 1) return;

    const timer = setInterval(goToNext, autoRotateInterval);
    return () => clearInterval(timer);
  }, [isPaused, shelfCount, autoRotateInterval, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
        setIsPaused(true);
      } else if (e.key === 'ArrowRight') {
        goToNext();
        setIsPaused(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Handle single shelf case - render static like DemoShelf
  if (shelfCount === 0) return null;

  const currentShelf = shelves[activeIndex];
  const displayItems = currentShelf.items.slice(0, 12);
  const shelfUrl = `/s/${currentShelf.shelf.share_token}`;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Featured shelves carousel"
      aria-roledescription="carousel"
    >
      {/* Shelf card with transition */}
      <div className="relative overflow-hidden">
        <Link
          href={shelfUrl}
          className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
          aria-label={`View ${currentShelf.shelf.name} shelf`}
        >
          {/* Shelf header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              {currentShelf.shelf.name}
            </h3>
            <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
              Click to explore →
            </span>
          </div>

          {/* Shelf items with fade transition */}
          <div 
            className="bg-white/50 backdrop-blur-sm transition-opacity duration-300"
            key={currentShelf.shelf.id}
          >
            <div
              className="px-4 py-4 flex flex-wrap gap-3"
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

        {/* Navigation arrows - only show if multiple shelves */}
        {shelfCount > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                goToPrev();
                setIsPaused(true);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition-colors z-10"
              aria-label="Previous shelf"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                goToNext();
                setIsPaused(true);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition-colors z-10"
              aria-label="Next shelf"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Navigation dots and helper text */}
      <div className="mt-3 flex flex-col items-center gap-2">
        {/* Dots - only show if multiple shelves */}
        {shelfCount > 1 && (
          <div className="flex gap-2" role="tablist" aria-label="Shelf navigation">
            {shelves.map((shelf, index) => (
              <button
                key={shelf.shelf.id}
                onClick={() => {
                  goToIndex(index);
                  setIsPaused(true);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex
                    ? 'bg-gray-700 w-4'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Go to ${shelf.shelf.name}`}
              />
            ))}
          </div>
        )}

        {/* Helper text */}
        <p className="text-sm text-gray-500">
          {shelfCount > 1 ? (
            <>Swipe or click arrows to see more shelves →</>
          ) : (
            <Link
              href={shelfUrl}
              className="hover:text-gray-700 hover:underline"
            >
              View full example shelf →
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
