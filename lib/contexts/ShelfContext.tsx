'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Item } from '@/lib/types/shelf';

/**
 * ShelfContext - Provides shared shelf state to avoid prop drilling
 * 
 * This context eliminates the need to pass editMode, onDeleteItem, onEditNote,
 * and onItemClick through multiple component layers (ShelfGrid → ShelfContainer → ShelfRow → ItemCard)
 * 
 * @see https://github.com/arielwernick/virtual_bookshelf/issues/94
 */

export interface ShelfContextValue {
  /** Whether the shelf is in edit mode (enables drag-and-drop, delete buttons) */
  editMode: boolean;
  /** Callback when an item should be deleted */
  onDeleteItem?: (itemId: string) => void;
  /** Callback when an item's note should be edited */
  onEditNote?: (item: Item) => void;
  /** Callback when an item is clicked (opens detail modal) */
  onItemClick?: (item: Item) => void;
}

const ShelfContext = createContext<ShelfContextValue | null>(null);

export interface ShelfProviderProps {
  children: ReactNode;
  editMode?: boolean;
  onDeleteItem?: (itemId: string) => void;
  onEditNote?: (item: Item) => void;
  onItemClick?: (item: Item) => void;
}

/**
 * ShelfProvider - Wraps shelf components to provide shared state
 * 
 * @example
 * ```tsx
 * <ShelfProvider editMode={true} onDeleteItem={handleDelete}>
 *   <ShelfContainer items={items} />
 * </ShelfProvider>
 * ```
 */
export function ShelfProvider({
  children,
  editMode = false,
  onDeleteItem,
  onEditNote,
  onItemClick,
}: ShelfProviderProps) {
  return (
    <ShelfContext.Provider
      value={{
        editMode,
        onDeleteItem,
        onEditNote,
        onItemClick,
      }}
    >
      {children}
    </ShelfContext.Provider>
  );
}

/**
 * useShelf - Hook to access shelf context values
 * 
 * Returns null if used outside of a ShelfProvider, allowing components
 * to work both with and without context (backwards compatible).
 * 
 * @example
 * ```tsx
 * function ItemCard({ item }) {
 *   const shelf = useShelf();
 *   const editMode = shelf?.editMode ?? false;
 *   const onDelete = shelf?.onDeleteItem;
 *   // ...
 * }
 * ```
 */
export function useShelf(): ShelfContextValue | null {
  return useContext(ShelfContext);
}

/**
 * useShelfRequired - Hook that throws if used outside ShelfProvider
 * 
 * Use this when a component MUST be inside a ShelfProvider.
 * 
 * @throws Error if used outside ShelfProvider
 */
export function useShelfRequired(): ShelfContextValue {
  const context = useContext(ShelfContext);
  if (!context) {
    throw new Error('useShelfRequired must be used within a ShelfProvider');
  }
  return context;
}
