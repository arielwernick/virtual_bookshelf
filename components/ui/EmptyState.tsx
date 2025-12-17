'use client';

import React from 'react';

// Common CTA button styles for both link and button variants
const CTA_BUTTON_STYLES = 'px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium';

interface EmptyStateProps {
  /** Optional icon element to display above the heading */
  icon?: React.ReactNode;
  /** Main heading text */
  heading: string;
  /** Supporting description text */
  subheading?: string;
  /** Text for the call-to-action button */
  ctaText?: string;
  /** Callback function when CTA button is clicked */
  onCTA?: () => void;
  /** Optional link URL for CTA (renders as anchor instead of button) */
  ctaHref?: string;
}

/**
 * Reusable empty state component with customizable icon, text, and CTA.
 * Used throughout the app to provide friendly feedback when content is missing.
 */
export function EmptyState({
  icon,
  heading,
  subheading,
  ctaText,
  onCTA,
  ctaHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4 bg-white dark:bg-gray-900 rounded-lg">
      {/* Icon */}
      {icon && (
        <div className="text-gray-400 dark:text-gray-500 mb-4" data-testid="empty-state-icon">
          {icon}
        </div>
      )}

      {/* Heading */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{heading}</h3>

      {/* Subheading */}
      {subheading && <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{subheading}</p>}

      {/* CTA Button or Link */}
      {ctaText && ctaHref && (
        <a href={ctaHref} className={`inline-block ${CTA_BUTTON_STYLES}`}>
          {ctaText}
        </a>
      )}
      {ctaText && onCTA && !ctaHref && (
        <button onClick={onCTA} className={CTA_BUTTON_STYLES}>
          {ctaText}
        </button>
      )}
    </div>
  );
}

/**
 * Bookshelf icon commonly used in empty states
 */
export function BookshelfIcon({ className = 'w-16 h-16 mx-auto' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}
