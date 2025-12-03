'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
 * Shows one shelf at a time with smooth slide transitions and navigation
 */
export function RotatingDemoShelf({ 
  shelves, 
  autoRotateInterval = 3000 
}: RotatingDemoShelfProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const shelfCount = shelves.length;

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setSlideDirection('left');
    setIsAnimating(true);
    setActiveIndex((prev) => (prev + 1) % shelfCount);
  }, [shelfCount, isAnimating]);

  const goToPrev = useCallback(() => {
    if (isAnimating) return;
    setSlideDirection('right');
    setIsAnimating(true);
    setActiveIndex((prev) => (prev - 1 + shelfCount) % shelfCount);
  }, [shelfCount, isAnimating]);

  const goToIndex = useCallback((index: number) => {
    if (isAnimating || index === activeIndex) return;
    setSlideDirection(index > activeIndex ? 'left' : 'right');
    setIsAnimating(true);
    setActiveIndex(index);
  }, [activeIndex, isAnimating]);

  // Reset animation state after transition completes
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

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

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      setIsPaused(true);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Handle single shelf case - render static like DemoShelf
  if (shelfCount === 0) return null;

  const currentShelf = shelves[activeIndex];
  const displayItems = currentShelf.items.slice(0, 12);
  const shelfUrl = `/s/${currentShelf.shelf.share_token}`;

  // Animation classes based on direction
  const getSlideClasses = () => {
    if (!isAnimating) return 'translate-x-0 opacity-100';
    return slideDirection === 'left' 
      ? 'animate-slide-in-left' 
      : 'animate-slide-in-right';
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Featured shelves carousel"
      aria-roledescription="carousel"
    >
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          0% {
            opacity: 0;
            transform: translateX(-30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>

      {/* Shelf card with slide transition */}
      <div className="relative overflow-hidden rounded-lg">
        <div 
          key={currentShelf.shelf.id}
          className={getSlideClasses()}
        >
          <Link
            href={shelfUrl}
            className="block bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
            aria-label={`View ${currentShelf.shelf.name} shelf`}
          >
            {/* Shelf header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                {currentShelf.shelf.name}
              </h3>
              <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors duration-200 flex items-center gap-1">
                Click to explore 
                <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>

            {/* Shelf items */}
            <div className="bg-gradient-to-b from-white dark:from-gray-900 to-gray-50/50 dark:to-gray-800/50">
              <div
                className="px-4 py-4 flex flex-wrap gap-3"
                style={{ alignItems: 'flex-end' }}
              >
                {displayItems.map((item, itemIndex) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-[80px] sm:w-[100px] transform transition-transform duration-300 group-hover:scale-[1.02]"
                    style={{ 
                      transitionDelay: `${itemIndex * 30}ms`,
                    }}
                  >
                    <div className="relative aspect-[2/3] rounded overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-md group-hover:shadow-lg transition-shadow duration-300">
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
                        <div className="absolute inset-0 flex items-center justify-center p-2 bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-200 dark:to-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400 text-center line-clamp-3 font-medium">
                            {item.title}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shelf divider - wooden shelf look */}
              <div
                className="h-2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>
          </Link>
        </div>

        {/* Navigation arrows - only show if multiple shelves */}
        {shelfCount > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToPrev();
                setIsPaused(true);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 dark:bg-gray-800/95 shadow-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-800 hover:scale-110 active:scale-95 transition-all duration-200 z-10 backdrop-blur-sm"
              aria-label="Previous shelf"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToNext();
                setIsPaused(true);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 dark:bg-gray-800/95 shadow-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-800 hover:scale-110 active:scale-95 transition-all duration-200 z-10 backdrop-blur-sm"
              aria-label="Next shelf"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Navigation dots and helper text */}
      <div className="mt-4 flex flex-col items-center gap-3">
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
                className={`h-2 rounded-full transition-all duration-300 ease-out ${
                  index === activeIndex
                    ? 'bg-gray-800 dark:bg-gray-200 w-6'
                    : 'bg-gray-300 dark:bg-gray-600 w-2 hover:bg-gray-400 dark:hover:bg-gray-500 hover:w-3'
                }`}
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Go to ${shelf.shelf.name}`}
              />
            ))}
          </div>
        )}

        {/* Helper text */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {shelfCount > 1 ? (
            <span className="flex items-center gap-1">
              <span className="hidden sm:inline">Swipe or use arrows</span>
              <span className="sm:hidden">Swipe</span>
              <span>to explore more shelves</span>
            </span>
          ) : (
            <Link
              href={shelfUrl}
              className="hover:text-gray-700 dark:hover:text-gray-300 hover:underline inline-flex items-center gap-1"
            >
              View full example shelf
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
