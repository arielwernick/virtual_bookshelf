'use client';

import { Item, ItemType } from '@/lib/types/shelf';
import { ItemCard } from './ItemCard';
import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
interface SortableItemProps {
  item: Item;
  onItemClick?: (item: Item) => void;
  editMode?: boolean;
  onDelete?: (itemId: string) => void;
  onEditNote?: (item: Item) => void;
}

function SortableItem({ item, onItemClick, editMode, onDelete, onEditNote }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(editMode ? listeners : {})} className="w-[100px] sm:w-[140px] flex-shrink-0">
      <ItemCard
        item={item}
        onClick={onItemClick ? () => onItemClick(item) : undefined}
        editMode={editMode}
        onDelete={onDelete ? () => onDelete(item.id) : undefined}
        onEditNote={onEditNote ? () => onEditNote(item) : undefined}
      />
    </div>
  );
}

function ShelfRow({ items, onItemClick, editMode, onDeleteItem, onEditNote }: ShelfRowProps) {
  // Only enable SortableContext in edit mode
  const content = editMode ? (
    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
      {items.map((item) => (
        <SortableItem
          key={item.id}
          item={item}
          onItemClick={onItemClick}
          editMode={editMode}
          onDelete={onDeleteItem}
          onEditNote={onEditNote}
        />
      ))}
    </SortableContext>
  ) : (
    items.map((item) => (
      <div key={item.id} className="w-[100px] sm:w-[140px] flex-shrink-0">
        <ItemCard
          item={item}
          onClick={onItemClick ? () => onItemClick(item) : undefined}
          editMode={editMode}
          onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
          onEditNote={onEditNote ? () => onEditNote(item) : undefined}
        />
      </div>
    ))
  );

  return (
    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
      <div
        className="px-3 py-3 sm:px-6 sm:py-5 flex flex-wrap"
        style={{
          gap: '0.5rem',
          alignItems: 'flex-end',
        }}
      >
        {content}
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
  const [orderedItems, setOrderedItems] = useState(items);
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

    updateWidth();

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

  // Recalculate shelves when items, order, or container width changes
  useEffect(() => {
    if (!containerRef.current || orderedItems.length === 0) {
      setShelves([orderedItems]);
      return;
    }

    const isMobile = window.innerWidth < 640;
    const itemWidth = isMobile ? 100 : 140;
    const gap = isMobile ? 8 : 16;
    const padding = isMobile ? 12 : 24;

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

    orderedItems.forEach(() => {
      const item = document.createElement('div');
      item.style.cssText = `width: ${itemWidth}px; flex-shrink: 0; height: ${isMobile ? 150 : 200}px;`;
      tempContainer.appendChild(item);
    });

    document.body.appendChild(tempContainer);

    const shelfMap: Item[][] = [];
    let currentShelf: Item[] = [];
    let currentY = (tempContainer.children[0] as HTMLElement)?.offsetTop ?? 0;

    Array.from(tempContainer.children).forEach((child, index) => {
      const childY = (child as HTMLElement).offsetTop;
      if (childY > currentY && currentShelf.length > 0) {
        shelfMap.push([...currentShelf]);
        currentShelf = [orderedItems[index]];
        currentY = childY;
      } else {
        currentShelf.push(orderedItems[index]);
      }
    });

    if (currentShelf.length > 0) {
      shelfMap.push(currentShelf);
    }

    document.body.removeChild(tempContainer);
    setShelves(shelfMap);
  }, [orderedItems, containerWidth]);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  // ...existing code...
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedItems.findIndex(i => i.id === active.id);
      const newIndex = orderedItems.findIndex(i => i.id === over.id);
      if (newIndex !== -1) {
        const newOrder = arrayMove(orderedItems, oldIndex, newIndex);
        setOrderedItems(newOrder);
        // Persist new order to backend
        try {
          const shelfId = newOrder[0]?.shelf_id;
          if (shelfId) {
            await fetch('/api/items/reorder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                shelf_id: shelfId,
                item_ids: newOrder.map(item => item.id),
              }),
            });
          }
        } catch (err) {
          // Optionally show error to user
          console.error('Failed to persist item order', err);
        }
      }
    }
  };

  if (editMode) {
    return (
      <div ref={containerRef} className="space-y-4 sm:space-y-6">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
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
          </SortableContext>
        </DndContext>
      </div>
    );
  }
  // Non-edit mode: preserve original layout
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
  const gridRef = useRef<HTMLDivElement>(null);

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
    <div ref={gridRef}>
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
