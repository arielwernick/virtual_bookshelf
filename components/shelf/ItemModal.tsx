'use client';

import { Item } from '@/lib/types/shelf';
import { Modal } from '../ui/Modal';

interface ItemModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemModal({ item, isOpen, onClose }: ItemModalProps) {
  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Cover Image */}
          <div className="md:w-64 flex-shrink-0">
            <div className="aspect-[2/3] relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-lg">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Item Details */}
          <div className="flex-1">
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                item.type === 'book' ? 'bg-blue-100 text-blue-800' :
                item.type === 'podcast' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'
              }`}>
                {item.type}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {item.title}
            </h2>

            <p className="text-lg text-gray-600 mb-6">
              by {item.creator}
            </p>

            {item.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{item.notes}</p>
              </div>
            )}

            {item.external_url && (
              <a
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
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
    </Modal>
  );
}
