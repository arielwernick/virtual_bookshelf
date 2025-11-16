'use client';

import { Item } from '@/lib/types/shelf';
import Image from 'next/image';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  editMode?: boolean;
  onDelete?: () => void;
}

export function ItemCard({ item, onClick, editMode, onDelete }: ItemCardProps) {
  const handleClick = () => {
    if (onClick && !editMode) {
      onClick();
    }
  };

  return (
    <div 
      className={`group relative bg-white rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md ${
        onClick && !editMode ? 'cursor-pointer' : ''
      }`}
      onClick={handleClick}
    >
      {/* Cover Image */}
      <div className="aspect-[2/3] relative bg-gray-100">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        
        {/* Type Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            item.type === 'book' ? 'bg-blue-100 text-blue-800' :
            item.type === 'podcast' ? 'bg-purple-100 text-purple-800' :
            'bg-green-100 text-green-800'
          }`}>
            {item.type}
          </span>
        </div>

        {/* Delete button in edit mode */}
        {editMode && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 left-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
            title="Delete item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Item Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
          {item.title}
        </h3>
        <p className="text-xs text-gray-600 line-clamp-1">
          {item.creator}
        </p>
      </div>
    </div>
  );
}
