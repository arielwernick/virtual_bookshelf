import { Shelf, Item, CreateItemData, ShelfType } from '../types/shelf';

/**
 * Maximum number of items allowed in a Top 5 shelf
 */
export const TOP5_MAX_ITEMS = 5;

/**
 * Valid shelf types
 */
const VALID_SHELF_TYPES: ShelfType[] = ['standard', 'top5'];

/**
 * Validate that adding an item won't exceed the Top 5 shelf capacity
 * @param itemCount Current number of items in the shelf
 */
export function validateTop5Capacity(itemCount: number): { valid: boolean; error?: string } {
  if (itemCount > TOP5_MAX_ITEMS) {
    return { valid: false, error: 'Top 5 shelf cannot have more than 5 items' };
  }
  return { valid: true };
}

/**
 * Validate that the new item is not a duplicate in the shelf
 * Duplicates are identified by matching title AND creator (case-insensitive)
 * Items of different types with same title/creator are allowed
 * @param items Existing items in the shelf
 * @param newItem The item being added
 */
export function validateNoDuplicateItems(
  items: Item[],
  newItem: CreateItemData
): { valid: boolean; error?: string } {
  const normalizedNewTitle = newItem.title.trim().toLowerCase();
  const normalizedNewCreator = newItem.creator.trim().toLowerCase();
  const newType = newItem.type;

  const isDuplicate = items.some((item) => {
    const normalizedTitle = item.title.trim().toLowerCase();
    const normalizedCreator = item.creator.trim().toLowerCase();
    
    return (
      item.type === newType &&
      normalizedTitle === normalizedNewTitle &&
      normalizedCreator === normalizedNewCreator
    );
  });

  if (isDuplicate) {
    return { valid: false, error: 'This item already exists in the shelf' };
  }

  return { valid: true };
}

/**
 * Check if a shelf is a Top 5 shelf
 * @param shelf The shelf to check
 */
export function isTop5Shelf(shelf: Shelf): boolean {
  return shelf.shelf_type === 'top5';
}

/**
 * Validate shelf type value
 * @param type The shelf type to validate
 */
export function validateShelfType(type: string): { valid: boolean; error?: string } {
  if (!VALID_SHELF_TYPES.includes(type as ShelfType)) {
    return { valid: false, error: 'Shelf type must be "standard" or "top5"' };
  }
  return { valid: true };
}
