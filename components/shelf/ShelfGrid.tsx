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
    <div className="bg-white/50 backdrop-blur-sm rounded-lg border border-gray-100 shadow-xs overflow-hidden">
      {/* Shelf items */}
      <div
        className="px-3 py-3 sm:px-6 sm:py-5 flex flex-wrap"
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
 * ShelfContainer - Splits items into shelf rows based on actual flex layout
 */
function ShelfContainer({ items, onItemClick, editMode, onDeleteItem, onEditNote }: ShelfContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shelves, setShelves] = useState<Item[][]>([]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShelves(shelfMap);
  }, [items]);

  return (
    <div ref={containerRef} className="space-y-4 sm:space-y-6">
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
