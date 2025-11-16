'use client';

import { Item, ItemType } from '@/lib/types/shelf';
import { ItemCard } from './ItemCard';
import { useState } from 'react';

interface ShelfGridProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
  editMode?: boolean;
  onDeleteItem?: (itemId: string) => void;
}

export function ShelfGrid({ items, onItemClick, editMode, onDeleteItem }: ShelfGridProps) {
  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all');

  const filteredItems = selectedType === 'all' 
    ? items 
    : items.filter(item => item.type === selectedType);

  const counts = {
    all: items.length,
    book: items.filter(i => i.type === 'book').length,
    podcast: items.filter(i => i.type === 'podcast').length,
    music: items.filter(i => i.type === 'music').length,
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            selectedType === 'all'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setSelectedType('book')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            selectedType === 'book'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Books ({counts.book})
        </button>
        <button
          onClick={() => setSelectedType('podcast')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            selectedType === 'podcast'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Podcasts ({counts.podcast})
        </button>
        <button
          onClick={() => setSelectedType('music')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            selectedType === 'music'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Music ({counts.music})
        </button>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedType === 'all' 
              ? 'This shelf is empty.' 
              : `No ${selectedType}s in this shelf.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={onItemClick ? () => onItemClick(item) : undefined}
              editMode={editMode}
              onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
