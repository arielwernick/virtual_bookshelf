'use client';

import { useState } from 'react';
import { Item } from '@/lib/types/shelf';
import { getAspectRatio } from '@/lib/constants/aspectRatios';
import { MAX_STAGGER_INDEX } from '@/lib/constants/animation';

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
  animationIndex?: number;
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
  animationIndex = 0,
}: Top5ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (onClick && !editMode) {
      onClick();
    }
  };

  const aspectRatio = getAspectRatio(item.type);
  const isClickable = onClick && !editMode;
  const hasNotes = Boolean(item.notes);

  const badgeColor = {
    book: 'bg-blue-100 text-blue-800',
    podcast: 'bg-purple-100 text-purple-800',
    music: 'bg-green-100 text-green-800',
  };

  // Gold gradient for rank badge
  const rankGradient = 'bg-gradient-to-r from-amber-400 to-yellow-500';

  // Get stagger class based on animation index (capped at MAX_STAGGER_INDEX)
  const staggerClass = animationIndex > 0 ? `stagger-${Math.min(animationIndex, MAX_STAGGER_INDEX)}` : '';

  return (
    <div
      className={`group relative bg-white rounded-lg shadow-sm overflow-hidden card-hover animate-fade-in-up ${staggerClass} ${
        isClickable ? 'cursor-pointer' : ''
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isDragOver ? 'ring-2 ring-amber-500 scale-105' : ''}`}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        className="relative bg-gradient-to-br from-gray-100 to-gray-200"
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
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pt-8">
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

        {/* Hover Overlay with item details (non-edit mode only) */}
        {!editMode && isHovered && isClickable && (
          <div className="absolute inset-0 bg-black/70 flex flex-col justify-end p-2 sm:p-3 animate-tooltip">
            <div className="text-white">
              <div className="flex items-center gap-1 text-amber-400 font-bold text-sm mb-1">
                #{rank}
              </div>
              <p className="text-xs font-semibold line-clamp-2 mb-0.5">{item.title}</p>
              <p className="text-[10px] text-gray-300 mb-1">by {item.creator}</p>
              {hasNotes && (
                <div className="flex items-center gap-1 text-amber-400 text-[10px]">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Has notes</span>
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-1.5">Click to view details</p>
            </div>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-1 right-8 sm:top-2 sm:right-10">
          <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${badgeColor[item.type]}`}>
            {item.type}
          </span>
        </div>

        {/* Note indicator icon (non-edit mode, when not hovered) */}
        {!editMode && hasNotes && !isHovered && (
          <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 p-1 bg-amber-100 rounded text-amber-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}

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
                className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 p-1.5 sm:p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors btn-interactive"
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
        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2 mb-0.5 sm:mb-1">
          {item.title}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-1">{item.creator}</p>
      </div>
    </div>
  );
}
