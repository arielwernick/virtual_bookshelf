'use client';

import { Item, ItemType } from '@/lib/types/shelf';
import { ItemCard } from './ItemCard';
import { useState, useRef, useEffect } from 'react';

// Constants for layout calculations
const MOBILE_BREAKPOINT = 640;
const ITEM_WIDTH_MOBILE = 100;
const ITEM_WIDTH_DESKTOP = 140;
const GAP_MOBILE = 8;
const GAP_DESKTOP = 16;
const PADDING_MOBILE = 12;
const PADDING_DESKTOP = 24;
const RESIZE_DEBOUNCE_MS = 150;

interface ShelfRowProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
  editMode?: boolean;
  onDeleteItem?: (itemId: string) => void;
  onEditNote?: (item: Item) => void;
  enableHorizontalScroll?: boolean;
}

/**
 * ShelfRow - A single shelf displaying items with a visual divider
 * Supports both wrapped and horizontal scroll layouts
 */
function ShelfRow({ items, onItemClick, editMode, onDeleteItem, onEditNote, enableHorizontalScroll = false }: ShelfRowProps) {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-lg border border-gray-100 shadow-xs overflow-hidden">
      {/* Shelf items */}
      <div
        className={`px-3 py-3 sm:px-6 sm:py-5 ${
          enableHorizontalScroll 
            ? 'flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent' 
            : 'flex flex-wrap'
        }`}
        style={{
          gap: '0.5rem',
          alignItems: 'flex-end',
        }}
      >
        {items.map((item) => (
          <div key={item.id} className="w-[100px] max-h-[180px] sm:w-[140px] sm:max-h-[240px] flex-shrink-0">
            <ItemCard
              item={item}
              onClick={onItemClick ? () => onItemClick(item) : undefined}
              editMode={editMode}
              onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
              onEditNote={onEditNote ? () => onEditNote(item) : undefined}
            />
          </div>
        ))}
      </div>

      {/* Shelf divider */}
      <div
        className="h-1.5 sm:h-2 bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400"
        style={{
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.45), 0 8px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(0, 0, 0, 0.1)',
        }}
      />
    </div>
  );
}

interface ShelfContainerProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
  editMode?: boolean;
  onDeleteItem?: (itemId: string) => void;
  onEditNote?: (item: Item) => void;
}

/**
 * Calculate items per row based on container width and viewport
 */
function calculateItemsPerRow(containerWidth: number, isMobile: boolean): number {
  const itemWidth = isMobile ? ITEM_WIDTH_MOBILE : ITEM_WIDTH_DESKTOP;
  const gap = isMobile ? GAP_MOBILE : GAP_DESKTOP;
  const padding = isMobile ? PADDING_MOBILE : PADDING_DESKTOP;
  
  const availableWidth = containerWidth - (padding * 2);
  if (availableWidth <= 0) return 1;
  
  // Calculate how many items fit: availableWidth = n*itemWidth + (n-1)*gap
  // Solving for n: n = (availableWidth + gap) / (itemWidth + gap)
  const itemsPerRow = Math.floor((availableWidth + gap) / (itemWidth + gap));
  return Math.max(1, itemsPerRow);
}

/**
 * Split items into shelf rows based on calculated items per row
 */
function splitIntoShelves(items: Item[], itemsPerRow: number): Item[][] {
  if (items.length === 0 || itemsPerRow <= 0) return [items];
  
  const shelves: Item[][] = [];
  for (let i = 0; i < items.length; i += itemsPerRow) {
    shelves.push(items.slice(i, i + itemsPerRow));
  }
  return shelves;
}

/**
 * ShelfContainer - Splits items into shelf rows based on container width
 * Automatically recalculates on window resize with debouncing
 */
function ShelfContainer({ items, onItemClick, editMode, onDeleteItem, onEditNote }: ShelfContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle resize with debouncing
  useEffect(() => {
    // Initial measurement
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
    }

    // Debounced resize handler
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.clientWidth);
        }
        if (typeof window !== 'undefined') {
          setWindowWidth(window.innerWidth);
        }
      }, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Re-measure when items change
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
  }, [items]);

  // Calculate derived values
  const isMobileView = windowWidth < MOBILE_BREAKPOINT;
  const itemsPerRow = containerWidth > 0 ? calculateItemsPerRow(containerWidth, isMobileView) : 1;
  const shelves = items.length > 0 ? splitIntoShelves(items, itemsPerRow) : [items];
  
  // On mobile, use horizontal scroll for single-row display option
  const useMobileHorizontalScroll = isMobileView && items.length > 3;

  return (
    <div ref={containerRef} className="space-y-4 sm:space-y-6">
      {useMobileHorizontalScroll ? (
        // Mobile horizontal scroll layout - single row with scroll
        <ShelfRow
          items={items}
          onItemClick={onItemClick}
          editMode={editMode}
          onDeleteItem={onDeleteItem}
          onEditNote={onEditNote}
          enableHorizontalScroll={true}
        />
      ) : (
        // Desktop and small mobile - wrapped rows
        shelves.map((shelfItems, index) => (
          <ShelfRow
            key={`shelf-${index}`}
            items={shelfItems}
            onItemClick={onItemClick}
            editMode={editMode}
            onDeleteItem={onDeleteItem}
            onEditNote={onEditNote}
          />
        ))
      )}
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

export function ShelfGrid({ items, onItemClick, editMode, onDeleteItem, onEditNote }: ShelfGridProps) {
  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all');

  const filteredItems =
    selectedType === 'all' ? items : items.filter((item) => item.type === selectedType);

  const counts = {
    all: items.length,
    book: items.filter((i) => i.type === 'book').length,
    podcast: items.filter((i) => i.type === 'podcast').length,
    music: items.filter((i) => i.type === 'music').length,
  };

  const filterButton = (type: ItemType | 'all', label: string, count: number) => (
    <button
      onClick={() => setSelectedType(type)}
      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
        selectedType === type
          ? `${type === 'all' ? 'border-gray-900 text-gray-900' : type === 'book' ? 'border-blue-600 text-blue-600' : type === 'podcast' ? 'border-purple-600 text-purple-600' : 'border-green-600 text-green-600'}`
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {filterButton('all', 'All', counts.all)}
        {filterButton('book', 'Books', counts.book)}
        {filterButton('podcast', 'Podcasts', counts.podcast)}
        {filterButton('music', 'Music', counts.music)}
      </div>

      {/* Shelves or empty state */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedType === 'all'
              ? 'This shelf is empty.'
              : `No ${selectedType}s in this shelf.`}
          </p>
        </div>
      ) : (
        <ShelfContainer
          items={filteredItems}
          onItemClick={onItemClick}
          editMode={editMode}
          onDeleteItem={onDeleteItem}
          onEditNote={onEditNote}
        />
      )}
    </div>
  );
}
