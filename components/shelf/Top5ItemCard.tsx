'use client';

import { Item } from '@/lib/types/shelf';
import { getAspectRatio } from '@/lib/constants/aspectRatios';

interface Top5ItemCardProps {
  item: Item;
  rank: number;
  onClick?: () => void;
  editMode?: boolean;
  onDelete?: () => void;
  // Drag and drop props
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export function Top5ItemCard({
  item,
  rank,
  onClick,
  editMode,
  onDelete,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
}: Top5ItemCardProps) {
  const handleClick = () => {
    if (onClick && !editMode) {
      onClick();
    }
  };

  const aspectRatio = getAspectRatio(item.type);
  const isClickable = onClick && !editMode;

  const badgeColor = {
    book: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
    podcast: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
    music: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
    podcast_episode: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200',
    video: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
  };

  // Gold gradient for rank badge
  const rankGradient = 'bg-gradient-to-r from-amber-400 to-yellow-500';

  return (
    <div
      className={`group relative bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden transition-all ${
        isClickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isDragOver ? 'ring-2 ring-amber-500 scale-105' : ''}`}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag Handle Indicator in edit mode */}
      {editMode && draggable && (
        <div className="absolute top-0 right-0 z-20 bg-amber-500 text-white p-1 rounded-bl-lg opacity-60 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      )}

      {/* Rank Badge */}
      <div
        className={`absolute top-0 left-0 z-10 ${rankGradient} text-white font-bold text-lg sm:text-xl px-3 py-1 rounded-br-lg shadow-md`}
      >
        #{rank}
      </div>

      {/* Image Container */}
      <div
        className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
        style={{ aspectRatio }}
      >
        {/* Item Image */}
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* Fallback Icon */}
        {!item.image_url && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 pt-8">
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
        <div className="absolute top-1 right-8 sm:top-2 sm:right-10">
          <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${badgeColor[item.type]}`}>
            {item.type}
          </span>
        </div>

        {/* Edit Mode Controls */}
        {editMode && (
          <>
            {/* Delete Button - Always visible in edit mode */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 p-1.5 sm:p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                title="Delete item"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Item Metadata */}
      <div className="p-2 sm:p-3">
        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-0.5 sm:mb-1">
          {item.title}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{item.creator}</p>
      </div>
    </div>
  );
}
