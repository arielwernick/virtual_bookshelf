'use client';

import { Item } from '@/lib/types/shelf';
import { useEffect } from 'react';

interface ItemModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemModal({ item, isOpen, onClose }: ItemModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10 rounded-t-lg">
          <h2 id="item-modal-title" className="text-lg font-semibold text-gray-900 truncate pr-4">
            {item.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            aria-label="Close dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            {/* Cover Image */}
            <div className="w-32 sm:w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0">
              <div className="aspect-[2/3] relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-lg">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Item Details */}
            <div className="flex-1">
              <div className="mb-3 sm:mb-4">
                <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                  item.type === 'book' ? 'bg-blue-100 text-blue-800' :
                  item.type === 'podcast' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {item.type}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {item.title}
              </h3>

              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                by {item.creator}
              </p>

              {item.notes && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{item.notes}</p>
                </div>
              )}

              {item.external_url && (
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm sm:text-base"
                >
                  <span>View on {
                    item.external_url.includes('spotify') ? 'Spotify' :
                    item.external_url.includes('google') ? 'Google Books' :
                    'External Site'
                  }</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
