'use client';

import React from 'react';

/**
 * Base skeleton element with pulse animation
 */
function SkeletonBase({
  className = '',
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`} aria-hidden="true">
      {children}
    </div>
  );
}

/**
 * Skeleton loader for dashboard shelf cards
 * Matches the dimensions and structure of real shelf cards
 */
export function SkeletonShelfCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6" data-testid="skeleton-shelf-card">
      {/* Title */}
      <SkeletonBase className="h-6 rounded w-3/4 mb-3" />
      
      {/* Description */}
      <SkeletonBase className="h-4 rounded w-full mb-2" />
      <SkeletonBase className="h-4 rounded w-2/3 mb-4" />
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <SkeletonBase className="h-4 rounded w-20" />
        <SkeletonBase className="h-4 rounded w-16" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for shelf item cards
 * Matches the dimensions and structure of real item cards
 */
export function SkeletonItemCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden" data-testid="skeleton-item-card">
      {/* Image placeholder with aspect ratio matching book covers (2/3) */}
      <SkeletonBase className="w-full aspect-[2/3]" />
      
      {/* Content area */}
      <div className="p-3">
        {/* Title */}
        <SkeletonBase className="h-4 rounded w-full mb-2" />
        <SkeletonBase className="h-4 rounded w-2/3 mb-2" />
        
        {/* Creator */}
        <SkeletonBase className="h-3 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * Grid of skeleton shelf cards for dashboard loading state
 */
export function SkeletonShelfGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="skeleton-shelf-grid">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonShelfCard key={index} />
      ))}
    </div>
  );
}

/**
 * Grid of skeleton item cards for shelf page loading state
 */
export function SkeletonItemGrid({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      data-testid="skeleton-item-grid"
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItemCard key={index} />
      ))}
    </div>
  );
}

/**
 * Skeleton for edit page header section
 */
export function SkeletonEditHeader() {
  return (
    <div data-testid="skeleton-edit-header">
      {/* Name label and title */}
      <div className="mb-2">
        <SkeletonBase className="h-3 rounded w-12 mb-2" />
      </div>
      <div className="mb-8 flex items-center gap-3">
        <SkeletonBase className="h-9 rounded w-64" />
        <SkeletonBase className="h-8 w-8 rounded" />
      </div>

      {/* Description label and content */}
      <div className="mb-2">
        <SkeletonBase className="h-3 rounded w-20 mb-2" />
      </div>
      <div className="mb-8">
        <SkeletonBase className="h-5 rounded w-full mb-2" />
        <SkeletonBase className="h-5 rounded w-3/4" />
      </div>

      {/* Add item button */}
      <div className="mb-6">
        <SkeletonBase className="h-12 rounded-lg w-32" />
      </div>
    </div>
  );
}
