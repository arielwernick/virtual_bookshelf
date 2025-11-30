'use client';

import { useState } from 'react';
import { Item } from '@/lib/types/shelf';
import { Top5ItemCard } from './Top5ItemCard';
import { TOP5_MAX_ITEMS } from '@/lib/utils/top5';

interface Top5ShelfGridProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
  editMode?: boolean;
  onDeleteItem?: (itemId: string) => void;
  onReorder?: (itemIds: string[]) => void;
}

interface EmptySlotProps {
  rank: number;
  editMode?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
}

function EmptySlot({ rank, editMode, onDragOver, onDrop, isDragOver }: EmptySlotProps) {
  return (
    <div 
      className={`relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed overflow-hidden transition-all ${
        isDragOver ? 'border-amber-500 bg-amber-50 scale-105' : 'border-gray-300'
      }`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Rank Badge */}
      <div className="absolute top-0 left-0 z-10 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold text-lg sm:text-xl px-3 py-1 rounded-br-lg">
        #{rank}
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center" style={{ aspectRatio: '2/3' }}>
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500">
          {editMode ? 'Add an item' : 'Empty slot'}
        </p>
      </div>
    </div>
  );
}

export function Top5ShelfGrid({
  items,
  onItemClick,
  editMode,
  onDeleteItem,
  onReorder,
}: Top5ShelfGridProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sort items by order_index
  const sortedItems = [...items].sort((a, b) => a.order_index - b.order_index);

  // Drag and drop handlers
  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(targetIndex);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItemId || !onReorder) return;

    const draggedIndex = sortedItems.findIndex((item) => item.id === draggedItemId);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedItemId(null);
      setDragOverIndex(null);
      return;
    }

    // Create new order array
    const newOrder = sortedItems.map((item) => item.id);
    
    // Remove dragged item
    newOrder.splice(draggedIndex, 1);
    
    // Insert at new position
    newOrder.splice(targetIndex, 0, draggedItemId);

    onReorder(newOrder);
    setDraggedItemId(null);
    setDragOverIndex(null);
  };

  // Create array of 5 slots
  const slots = Array.from({ length: TOP5_MAX_ITEMS }, (_, index) => {
    const item = sortedItems[index];
    const rank = index + 1;

    if (item) {
      return (
        <Top5ItemCard
          key={item.id}
          item={item}
          rank={rank}
          onClick={onItemClick ? () => onItemClick(item) : undefined}
          editMode={editMode}
          onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
          draggable={editMode && !!onReorder}
          onDragStart={() => handleDragStart(item.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          isDragging={draggedItemId === item.id}
          isDragOver={dragOverIndex === index && draggedItemId !== item.id}
          animationIndex={rank}
        />
      );
    }

    return (
      <EmptySlot 
        key={`empty-${rank}`} 
        rank={rank} 
        editMode={editMode}
        onDragOver={editMode ? (e) => handleDragOver(e, index) : undefined}
        onDrop={editMode ? (e) => handleDrop(e, index) : undefined}
        isDragOver={dragOverIndex === index}
      />
    );
  });

  return (
    <div>
      {/* Trophy Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-amber-500">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Top 5</h2>
        <span className="text-sm text-gray-500">
          {items.length} of {TOP5_MAX_ITEMS} ranked
        </span>
      </div>

      {/* Gold Border Container */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 sm:p-6 border-2 border-amber-200 shadow-sm">
        {/* Grid of 5 slots */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
          {slots}
        </div>
      </div>

      {/* Helper text in edit mode */}
      {editMode && items.length < TOP5_MAX_ITEMS && (
        <p className="mt-4 text-sm text-gray-500 text-center">
          Add {TOP5_MAX_ITEMS - items.length} more item{TOP5_MAX_ITEMS - items.length !== 1 ? 's' : ''} to complete your Top 5
        </p>
      )}

      {/* Drag hint in edit mode */}
      {editMode && items.length > 1 && (
        <p className="mt-2 text-sm text-amber-600 text-center">
          💡 Drag and drop items to reorder your rankings
        </p>
      )}
    </div>
  );
}
