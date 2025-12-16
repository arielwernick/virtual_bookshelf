'use client';

import { Item, ItemType } from '@/lib/types/shelf';
import { ItemCard } from './ItemCard';
import { useState, useRef, useEffect } from 'react';

interface ShelfRowProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
  editMode?: boolean;
  onDeleteItem?: (itemId: string) => void;
  onEditNote?: (item: Item) => void;
}

/**
 * ShelfRow - A single shelf displaying items with a visual divider
 */
function ShelfRow({ items, onItemClick, editMode, onDeleteItem, onEditNote }: ShelfRowProps) {
  return (
    <div className="relative bg-gradient-to-b from-warm-white to-warm-cream rounded-2xl border border-warm-brown/10 shadow-sm shadow-card-shadow overflow-hidden">
      {/* Clean, subtle background with warm undertone */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-warm-brown/3 to-warm-brown/5 pointer-events-none" />
      
      {/* Shelf items with modern spacing */}
      <div
        className="relative px-6 py-6 sm:px-10 sm:py-8 flex flex-wrap"
        style={{
          gap: '1rem',
          alignItems: 'flex-end',
        }}
      >
        {items.map((item) => (
          <div key={item.id} className="w-[120px] max-h-[200px] sm:w-[140px] sm:max-h-[240px] flex-shrink-0">
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

      {/* Clean, modern bottom accent */}
      <div
        className="h-1 bg-gradient-to-r from-warm-brown/20 via-warm-brown/30 to-warm-brown/20"
        style={{
          boxShadow: '0 2px 8px rgba(107, 78, 61, 0.15)',
        }}
      >
      </div>
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
 * ShelfContainer - Splits items into shelf rows based on actual flex layout
 * Recalculates on window resize with debouncing
 */
function ShelfContainer({ items, onItemClick, editMode, onDeleteItem, onEditNote }: ShelfContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shelves, setShelves] = useState<Item[][]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track container width changes with debouncing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    // Initial measurement
    updateWidth();

    // Debounced resize handler
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(updateWidth, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Recalculate shelves when items or container width changes
  useEffect(() => {
    if (!containerRef.current || items.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShelves([items]);
      return;
    }

    // Determine if we're on mobile (small screen)
    const isMobile = window.innerWidth < 640; // sm breakpoint
    const itemWidth = isMobile ? 100 : 140;
    const gap = isMobile ? 8 : 16; // 0.5rem = 8px, 1rem = 16px
    const padding = isMobile ? 12 : 24; // px-3 = 12px, px-6 = 24px

    // Measure flex layout with temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: ${gap}px;
      padding: ${padding}px;
      position: absolute;
      visibility: hidden;
      width: ${containerRef.current.clientWidth}px;
    `;

    // Create measurement items
    items.forEach(() => {
      const item = document.createElement('div');
      item.style.cssText = `width: ${itemWidth}px; flex-shrink: 0; height: ${isMobile ? 150 : 200}px;`;
      tempContainer.appendChild(item);
    });

    document.body.appendChild(tempContainer);

    // Determine which items belong to which shelf based on Y position
    const shelfMap: Item[][] = [];
    let currentShelf: Item[] = [];
    let currentY = (tempContainer.children[0] as HTMLElement)?.offsetTop ?? 0;

    Array.from(tempContainer.children).forEach((child, index) => {
      const childY = (child as HTMLElement).offsetTop;

      if (childY > currentY && currentShelf.length > 0) {
        shelfMap.push([...currentShelf]);
        currentShelf = [items[index]];
        currentY = childY;
      } else {
        currentShelf.push(items[index]);
      }
    });

    if (currentShelf.length > 0) {
      shelfMap.push(currentShelf);
    }

    document.body.removeChild(tempContainer);
    setShelves(shelfMap);
  }, [items, containerWidth]);

  return (
    <div ref={containerRef} className="space-y-8 sm:space-y-10 p-4 sm:p-6 bg-gradient-to-b from-warm-white via-warm-cream/50 to-warm-cream rounded-3xl border border-warm-brown/8 shadow-lg shadow-card-shadow">
      {shelves.map((shelfItems, index) => (
        <ShelfRow
          key={`shelf-${index}`}
          items={shelfItems}
          onItemClick={onItemClick}
          editMode={editMode}
          onDeleteItem={onDeleteItem}
          onEditNote={onEditNote}
        />
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

export function ShelfGrid({ items, onItemClick, editMode, onDeleteItem, onEditNote }: ShelfGridProps) {
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
  };

  const filterButton = (type: ItemType | 'all', label: string, count: number) => (
    <button
      onClick={() => setSelectedType(type)}
      className={`px-6 py-3 font-medium text-sm rounded-xl transition-all duration-300 ${
        selectedType === type
          ? `${type === 'all' ? 'bg-warm-brown text-warm-white shadow-lg shadow-warm-brown/20' : type === 'book' ? 'bg-muted-gold text-warm-white shadow-lg shadow-muted-gold/20' : type === 'podcast' ? 'bg-warm-brown text-warm-white shadow-lg shadow-warm-brown/20' : 'bg-warm-brown text-warm-white shadow-lg shadow-warm-brown/20'}`
          : 'bg-white text-text-medium border border-warm-brown/15 hover:border-warm-brown/25 hover:bg-warm-cream hover:shadow-md shadow-sm'
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-4 mb-10 p-6 bg-gradient-to-r from-warm-white via-white to-warm-white rounded-2xl border border-warm-brown/10 shadow-sm">
        {filterButton('all', 'All', counts.all)}
        {filterButton('book', 'Books', counts.book)}
        {filterButton('podcast', 'Podcasts', counts.podcast)}
        {filterButton('music', 'Music', counts.music)}
      </div>

      {/* Shelves or empty state */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-24 px-10 bg-gradient-to-b from-warm-white to-warm-cream rounded-3xl border border-warm-brown/8 shadow-sm">
          <svg className="mx-auto h-20 w-20 text-warm-brown/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-6 text-xl font-semibold text-text-dark">Your shelf is ready</h3>
          <p className="mt-3 text-base text-text-medium opacity-80 max-w-md mx-auto">
            {selectedType === 'all'
              ? 'Add your first book, podcast, or music to get started.'
              : `Start adding ${selectedType}s to your collection.`}
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
