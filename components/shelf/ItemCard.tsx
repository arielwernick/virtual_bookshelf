'use client';

import { useState } from 'react';
import { Item } from '@/lib/types/shelf';
import { getAspectRatio } from '@/lib/constants/aspectRatios';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  editMode?: boolean;
  onDelete?: () => void;
  onEditNote?: () => void;
  animationIndex?: number;
}

export function ItemCard({ item, onClick, editMode, onDelete, onEditNote, animationIndex = 0 }: ItemCardProps) {
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

  // Get stagger class based on animation index (capped at 12)
  const staggerClass = animationIndex > 0 ? `stagger-${Math.min(animationIndex, 12)}` : '';

  return (
    <div
      className={`group relative bg-white rounded-lg shadow-sm overflow-hidden card-hover animate-fade-in-up ${staggerClass} ${
        isClickable ? 'cursor-pointer' : ''
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* Fallback Icon */}
        {!item.image_url && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
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
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
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

        {/* Delete Button - Always visible in edit mode for better discoverability */}
        {editMode && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-1 left-1 sm:top-2 sm:left-2 p-1.5 sm:p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
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

        {/* Edit Note Button (edit mode) - Always visible for better discoverability */}
        {editMode && onEditNote && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditNote();
            }}
            className={`absolute bottom-1 left-1 sm:bottom-2 sm:left-2 flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium transition-colors ${
              hasNotes 
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={hasNotes ? 'Edit note' : 'Add note'}
            data-testid={hasNotes ? 'edit-note-button' : 'add-note-button'}
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="hidden sm:inline">{hasNotes ? 'Edit' : 'Note'}</span>
          </button>
        )}
      </div>

      {/* Item Metadata */}
      <div className="p-2 sm:p-3">
        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2 mb-0.5 sm:mb-1">
          {item.title}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-1">{item.creator}</p>
        
        {/* Display note text preview if exists (non-edit mode) */}
        {!editMode && hasNotes && (
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-100">
            <p className="text-[10px] sm:text-xs text-gray-500 italic line-clamp-2" data-testid="note-preview">
              &ldquo;{item.notes}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
