/**
 * StarDisplayStatic - Server-renderable star rating display
 * No 'use client' directive - safe for SSR
 */

interface StarDisplayStaticProps {
  rating: number | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function StarDisplayStatic({ rating, size = 'sm' }: StarDisplayStaticProps) {
  if (rating === null || rating === undefined) {
    return null;
  }

  const stars = [];
  const sizeClass = sizeClasses[size];

  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= rating;
    stars.push(
      <svg
        key={i}
        className={`${sizeClass} ${
          isFilled
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-gray-300 dark:text-gray-600'
        }`}
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
    );
  }

  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {stars}
    </div>
  );
}
