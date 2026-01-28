'use client';

import { useState, useCallback, ReactNode } from 'react';
import { ItemModal } from '@/components/shelf/ItemModal';
import { Item } from '@/lib/types/shelf';

interface SharedShelfInteractiveProps {
  items: Item[];
  children: ReactNode;
}

/**
 * SharedShelfInteractive - Client wrapper for interactive features
 *
 * Handles:
 * - ItemModal state and display
 * - Click handling for static item cards (via event delegation)
 *
 * The static content is rendered as children (from server component)
 * and this component adds interactivity on top.
 */
export function SharedShelfInteractive({ items, children }: SharedShelfInteractiveProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Use event delegation to handle clicks on static item cards
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Find the closest item card element
      const itemCard = (e.target as HTMLElement).closest('[data-item-id]');
      if (itemCard) {
        const itemId = itemCard.getAttribute('data-item-id');
        const item = items.find((i) => i.id === itemId);
        if (item) {
          setSelectedItem(item);
        }
      }
    },
    [items]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const itemCard = (e.target as HTMLElement).closest('[data-item-id]');
        if (itemCard) {
          e.preventDefault();
          const itemId = itemCard.getAttribute('data-item-id');
          const item = items.find((i) => i.id === itemId);
          if (item) {
            setSelectedItem(item);
          }
        }
      }
    },
    [items]
  );

  return (
    <>
      {/* 
        Wrap children (server-rendered content) with click handling.
        Children are the static shelf grid - they become interactive
        through event delegation.
      */}
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="cursor-pointer"
        role="region"
        aria-label="Interactive shelf - click items for details"
      >
        {children}
      </div>

      {/* Item Modal - client-only interactive component */}
      <ItemModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
