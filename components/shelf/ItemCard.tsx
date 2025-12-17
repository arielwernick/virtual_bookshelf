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
    book: 'bg-amber-600/90 text-white shadow-sm backdrop-blur-sm',
    podcast: 'bg-amber-700/90 text-white shadow-sm backdrop-blur-sm',
    music: 'bg-amber-800/90 text-white shadow-sm backdrop-blur-sm',
    podcast_episode: 'bg-amber-700/90 text-white shadow-sm backdrop-blur-sm',
    video: 'bg-amber-500/90 text-white shadow-sm backdrop-blur-sm',
  };

  return (
    <div
      className={`group relative bg-white rounded overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
        isClickable ? 'cursor-pointer' : ''
      }`}
      onClick={handleClick}
    >
      {/* Clean Image Container */}
      <div
        className="relative bg-gray-100"
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
                strokeWidth={1.5}
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

        {/* Delete Button - Always visible in edit mode for better discoverability */}
        {editMode && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
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
            className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm ${
              hasNotes 
                ? 'bg-muted-gold text-white hover:bg-muted-gold/90 hover:shadow-md' 
                : 'bg-white border border-warm-brown/20 text-text-medium hover:bg-warm-cream hover:border-warm-brown/30'
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
      <div className="p-4 bg-gradient-to-b from-warm-white/50 to-warm-cream/30">
        <h3 className="font-semibold text-sm text-text-dark line-clamp-2 mb-2">
          {item.title}
        </h3>
        <p className="text-xs text-text-medium line-clamp-1">{item.creator}</p>
        
        {/* Display note text preview if exists (non-edit mode) */}
        {!editMode && hasNotes && (
          <div className="mt-3 pt-3 border-t border-warm-brown/15">
            <p className="text-xs text-text-medium italic line-clamp-2" data-testid="note-preview">
              &ldquo;{item.notes}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
