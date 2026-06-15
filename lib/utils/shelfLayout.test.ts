import { describe, it, expect } from 'vitest';
import { Item } from '@/lib/types/shelf';
import {
  SSR_SAFE_ITEMS_PER_ROW,
  computeItemsPerRow,
  splitIntoRows,
} from './shelfLayout';

function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: `item-${Math.random().toString(36).slice(2, 11)}`,
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'book',
    title: 'Test Book',
    creator: 'Test Author',
    image_url: null,
    external_url: null,
    notes: null,
    rating: null,
    order_index: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('shelfLayout', () => {
  describe('computeItemsPerRow', () => {
    it('fits 7 (not 8) cards on a full-width max-w-7xl desktop shelf', () => {
      // Regression: hardcoded 8/row used to wrap onto a second line here.
      expect(computeItemsPerRow(1216, false)).toBe(7);
    });

    it('fits fewer cards as the desktop container narrows', () => {
      expect(computeItemsPerRow(1024, false)).toBe(6);
      expect(computeItemsPerRow(768, false)).toBe(4);
    });

    it('uses the smaller mobile geometry below the breakpoint', () => {
      expect(computeItemsPerRow(375, true)).toBe(3);
      expect(computeItemsPerRow(320, true)).toBe(2);
    });

    it('never returns less than 1, even for tiny containers', () => {
      expect(computeItemsPerRow(50, false)).toBe(1);
      expect(computeItemsPerRow(0, true)).toBe(1);
    });
  });

  describe('splitIntoRows', () => {
    it('chunks items into rows of at most itemsPerRow', () => {
      const items = Array.from({ length: 5 }, (_, i) => createMockItem({ id: `i-${i}` }));
      const rows = splitIntoRows(items, 2);
      expect(rows.map((r) => r.length)).toEqual([2, 2, 1]);
    });

    it('returns a single row when everything fits', () => {
      const items = Array.from({ length: 3 }, (_, i) => createMockItem({ id: `i-${i}` }));
      expect(splitIntoRows(items, SSR_SAFE_ITEMS_PER_ROW)).toHaveLength(1);
    });

    it('returns an empty array for no items', () => {
      expect(splitIntoRows([], 5)).toEqual([]);
    });

    it('guards against a non-positive itemsPerRow (no infinite loop)', () => {
      const items = [createMockItem(), createMockItem()];
      expect(splitIntoRows(items, 0)).toEqual([[items[0]], [items[1]]]);
    });
  });
});
