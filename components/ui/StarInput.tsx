'use client';

import { useState } from 'react';

interface StarInputProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5', 
  lg: 'w-6 h-6',
};

export function StarInput({ value, onChange, size = 'md', label = 'Rating' }: StarInputProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  const sizeClass = sizeClasses[size];
  const displayRating = hoverRating !== null ? hoverRating : (value || 0);

  const handleClick = (rating: number) => {
    if (value === rating) {
      // If clicking the same rating, clear it (set to null)
      onChange(null);
    } else {
      onChange(rating);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, rating: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(rating);
    }
  };

  const stars = [];

  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= displayRating;
    const isHovered = hoverRating !== null && i <= hoverRating;
    
    stars.push(
      <button
        key={i}
        type="button"
        className={`${sizeClass} transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 rounded ${
          isFilled 
            ? 'text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300' 
            : 'text-gray-300 dark:text-gray-600 hover:text-amber-400 dark:hover:text-amber-500'
        }`}
        onClick={() => handleClick(i)}
        onMouseEnter={() => setHoverRating(i)}
        onMouseLeave={() => setHoverRating(null)}
        onKeyDown={(e) => handleKeyDown(e, i)}
        aria-label={`Rate ${i} star${i !== 1 ? 's' : ''}`}
        title={`Rate ${i} star${i !== 1 ? 's' : ''}`}
      >
        <svg
          fill={isFilled ? 'currentColor' : 'none'}
          stroke={isFilled ? 'none' : 'currentColor'}
          strokeWidth={isFilled ? 0 : 2}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div 
        className="flex items-center gap-1" 
        role="radiogroup" 
        aria-label="Star rating"
      >
        {stars}
        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 rounded"
            title="Clear rating"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}