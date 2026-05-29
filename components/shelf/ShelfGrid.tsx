'use client';

import { Item, ItemType } from '@/lib/types/shelf';
import { ItemCard } from './ItemCard';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ShelfProvider, useShelf } from '@/lib/contexts/ShelfContext';

/**
 * Dynamically import the DnD-powered container so that @dnd-kit is only
 * downloaded by users who open a shelf in edit mode.
 */
const ShelfContainerDnd = dynamic(
  () => import('./ShelfContainerDnd').then(m => m.ShelfContainerDnd),
  { ssr: false },
);

/**
 * splitIntoRows - splits a flat items array into rows of at most `itemsPerRow`
 * items, used for the static (view-mode) shelf layout.
 */
function splitIntoRows(items: Item[], itemsPerRow: number = 8): Item[][] {
  const rows: Item[][] = [];
  for (let i = 0; i < items.length; i += itemsPerRow) {
    rows.push(items.slice(i, i + itemsPerRow));
  }
  return rows;
}

interface ShelfRowProps {
  items: Item[];
}

/**
 * ShelfRow - A single shelf displaying items with a visual divider (view mode).
 * Uses ShelfContext for callbacks (no prop drilling).
 */
function ShelfRow({ items }: ShelfRowProps) {
  const shelf = useShelf();
  const onItemClick = shelf?.onItemClick;

  return (
    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
      <div
        className="px-3 py-3 sm:px-6 sm:py-5 flex flex-wrap"
        style={{
          gap: '0.5rem',
          alignItems: 'flex-end',
        }}
      >
        {items.map((item) => (
          <div key={item.id} className="w-[100px] sm:w-[140px] flex-shrink-0" onClick={() => onItemClick?.(item)}>
            <ItemCard item={item} />
          </div>
        ))}
      </div>
      <div
        className="h-1.5 sm:h-2 bg-gradient-to-r from-warm-brown via-muted-gold to-warm-brown"
        style={{
          boxShadow: '0 8px 16px rgba(139, 95, 71, 0.4), 0 4px 8px rgba(139, 95, 71, 0.3), inset 0 1px 0 rgba(212, 146, 26, 0.2)',
        }}
      />
    </div>
  );
}

interface ShelfContainerProps {
  items: Item[];
}

/**
 * ShelfContainer - Static view-mode container.
 * Items are split into rows using a simple calculation with no DOM measurement
 * so that @dnd-kit is never imported on the viewer bundle.
 */
function ShelfContainer({ items }: ShelfContainerProps) {
  const rows = splitIntoRows(items);
  return (
    <div className="space-y-4 sm:space-y-6">
      {rows.map((rowItems, index) => (
        <ShelfRow key={`shelf-${index}`} items={rowItems} />
      ))}
    </div>
  );
}

interface ShelfGridProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
  editMode?: boolean;
  onDeleteItem?: (itemId: string) => void;
  onEditNote?: (item: Item) => void;
}

export function ShelfGrid({ items, onItemClick, editMode = false, onDeleteItem, onEditNote }: ShelfGridProps) {
  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all');

  const filteredItems = selectedType === 'all' 
    ? items 
    : selectedType === 'podcast'
    ? items.filter((item) => item.type === 'podcast' || item.type === 'podcast_episode')
    : items.filter((item) => item.type === selectedType);

  const counts = {
    all: items.length,
    book: items.filter((i) => i.type === 'book').length,
    podcast: items.filter((i) => i.type === 'podcast' || i.type === 'podcast_episode').length,
    music: items.filter((i) => i.type === 'music').length,
    video: items.filter((i) => i.type === 'video').length,
    link: items.filter((i) => i.type === 'link').length,
    stock: items.filter((i) => i.type === 'stock').length,
  };

  const activeColor: Record<string, string> = {
    all:     'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100',
    book:    'border-blue-600 text-blue-600',
    podcast: 'border-purple-600 text-purple-600',
    music:   'border-green-600 text-green-600',
    video:   'border-red-600 text-red-600',
    link:    'border-orange-500 text-orange-500',
    stock:   'border-purple-600 text-purple-600',
  };

  const filterButton = (type: ItemType | 'all', label: string, count: number) => (
    <button
      key={type}
      onClick={() => setSelectedType(type)}
      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
        selectedType === type
          ? activeColor[type]
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <ShelfProvider
      editMode={editMode}
      onDeleteItem={onDeleteItem}
      onEditNote={onEditNote}
      onItemClick={onItemClick}
    >
      <div>
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {filterButton('all', 'All', counts.all)}
          {filterButton('book', 'Books', counts.book)}
          {filterButton('podcast', 'Podcasts', counts.podcast)}
          {filterButton('music', 'Music', counts.music)}
          {filterButton('video', 'Videos', counts.video)}
          {counts.link > 0 && filterButton('link', 'Links', counts.link)}
          {counts.stock > 0 && filterButton('stock', 'Stocks', counts.stock)}
        </div>

        {/* Shelves or empty state */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No items</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {selectedType === 'all'
                ? 'This shelf is empty.'
                : `No ${selectedType}s in this shelf.`}
            </p>
          </div>
        ) : editMode ? (
          <ShelfContainerDnd items={filteredItems} />
        ) : (
          <ShelfContainer items={filteredItems} />
        )}
      </div>
    </ShelfProvider>
  );
}
