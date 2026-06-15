'use client';

import { Item } from '@/lib/types/shelf';
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
import { useShelf } from '@/lib/contexts/ShelfContext';
import { useShelfRows } from '@/lib/hooks/useShelfRows';

interface SortableItemProps {
  item: Item;
}

function SortableItem({ item }: SortableItemProps) {
  const shelf = useShelf();
  const editMode = shelf?.editMode ?? false;

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
      <ItemCard item={item} />
    </div>
  );
}

interface ShelfRowDndProps {
  items: Item[];
}

function ShelfRowDnd({ items }: ShelfRowDndProps) {
  return (
    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
      <div
        className="px-3 py-3 sm:px-6 sm:py-5 flex flex-wrap"
        style={{
          gap: '0.5rem',
          alignItems: 'flex-end',
        }}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItem key={item.id} item={item} />
          ))}
        </SortableContext>
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

interface ShelfContainerDndProps {
  items: Item[];
}

/**
 * ShelfContainerDnd - Edit-mode shelf container with drag-and-drop support.
 *
 * Dynamically imported via next/dynamic (ssr: false) so that @dnd-kit is only
 * bundled for users in edit mode, keeping the viewer bundle smaller.
 */
export function ShelfContainerDnd({ items }: ShelfContainerDndProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [orderedItems, setOrderedItems] = useState(items);

  // Size rows to the live container width (shared with view mode) so a shelf
  // never wraps its items onto a second visual line under one ledge.
  const shelves = useShelfRows(orderedItems, containerRef);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedItems.findIndex(i => i.id === active.id);
      const newIndex = orderedItems.findIndex(i => i.id === over.id);
      if (newIndex !== -1) {
        const newOrder = arrayMove(orderedItems, oldIndex, newIndex);
        setOrderedItems(newOrder);
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
          console.error('Failed to persist item order', err);
        }
      }
    }
  };

  return (
    <div ref={containerRef} className="space-y-4 sm:space-y-6">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {shelves.map((shelfItems, index) => (
            <ShelfRowDnd key={`shelf-${index}`} items={shelfItems} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
