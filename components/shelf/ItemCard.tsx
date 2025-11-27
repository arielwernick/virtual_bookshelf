'use client';

import { Item } from '@/lib/types/shelf';
import { getAspectRatio } from '@/lib/constants/aspectRatios';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  editMode?: boolean;
  onDelete?: () => void;
  onEditNote?: () => void;
}

export function ItemCard({ item, onClick, editMode, onDelete, onEditNote }: ItemCardProps) {
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

  return (
    <div
      className={`group relative bg-white rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${
        isClickable ? 'cursor-pointer' : ''
      }`}
      onClick={handleClick}
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

        {/* Type Badge */}
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
          <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${badgeColor[item.type]}`}>
            {item.type}
          </span>
        </div>

        {/* Note Indicator (non-edit mode) */}
        {!editMode && hasNotes && (
          <div 
            className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-1 bg-white/80 rounded-full"
            title="Has notes"
            data-testid="note-indicator"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        )}

        {/* Delete Button */}
        {editMode && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-1 left-1 sm:top-2 sm:left-2 p-1.5 sm:p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
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

        {/* Edit Note Button (edit mode) */}
        {editMode && onEditNote && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditNote();
            }}
            className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-1.5 sm:p-2 bg-gray-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800"
            title={hasNotes ? 'Edit note' : 'Add note'}
            data-testid={hasNotes ? 'edit-note-button' : 'add-note-button'}
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
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
