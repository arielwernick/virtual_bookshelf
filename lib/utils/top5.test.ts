import { describe, it, expect } from 'vitest';
import {
  validateTop5Capacity,
  validateNoDuplicateItems,
  isTop5Shelf,
  validateShelfType,
  TOP5_MAX_ITEMS,
} from './top5';
import { Shelf, Item, CreateItemData, ShelfType } from '../types/shelf';

// Helper to create mock shelf
function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'Test Shelf',
    description: null,
    share_token: 'token-123',
    is_public: false,
    shelf_type: 'standard',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

// Helper to create mock item
function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'book',
    title: 'Test Book',
    creator: 'Test Author',
    image_url: null,
    external_url: null,
    notes: null,
    order_index: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

// ============================================================================
// validateTop5Capacity Tests
// ============================================================================

describe('validateTop5Capacity', () => {
  it('accepts 0 items', () => {
    const result = validateTop5Capacity(0);
    expect(result.valid).toBe(true);
  });

  it('accepts 1 item', () => {
    const result = validateTop5Capacity(1);
    expect(result.valid).toBe(true);
  });

  it('accepts 4 items', () => {
    const result = validateTop5Capacity(4);
    expect(result.valid).toBe(true);
  });

  it('accepts exactly 5 items', () => {
    const result = validateTop5Capacity(5);
    expect(result.valid).toBe(true);
  });

  it('rejects 6 items', () => {
    const result = validateTop5Capacity(6);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Top 5 shelf cannot have more than 5 items');
  });

  it('rejects 10 items', () => {
    const result = validateTop5Capacity(10);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Top 5 shelf cannot have more than 5 items');
  });

  it('exports TOP5_MAX_ITEMS constant as 5', () => {
    expect(TOP5_MAX_ITEMS).toBe(5);
  });
});

// ============================================================================
// validateNoDuplicateItems Tests
// ============================================================================

describe('validateNoDuplicateItems', () => {
  it('accepts new item when shelf is empty', () => {
    const items: Item[] = [];
    const newItem: CreateItemData = {
      type: 'book',
      title: 'The Great Gatsby',
      creator: 'F. Scott Fitzgerald',
    };
    
    const result = validateNoDuplicateItems(items, newItem);
    expect(result.valid).toBe(true);
  });

  it('accepts new item with different title and creator', () => {
    const items = [
      createMockItem({ title: 'Book One', creator: 'Author One' }),
    ];
    const newItem: CreateItemData = {
      type: 'book',
      title: 'Book Two',
      creator: 'Author Two',
    };
    
    const result = validateNoDuplicateItems(items, newItem);
    expect(result.valid).toBe(true);
  });

  it('accepts item with same title but different creator', () => {
    const items = [
      createMockItem({ title: 'The Best Of', creator: 'Artist One' }),
    ];
    const newItem: CreateItemData = {
      type: 'music',
      title: 'The Best Of',
      creator: 'Artist Two',
    };
    
    const result = validateNoDuplicateItems(items, newItem);
    expect(result.valid).toBe(true);
  });

  it('accepts item with same creator but different title', () => {
    const items = [
      createMockItem({ title: 'Book One', creator: 'Same Author' }),
    ];
    const newItem: CreateItemData = {
      type: 'book',
      title: 'Book Two',
      creator: 'Same Author',
    };
    
    const result = validateNoDuplicateItems(items, newItem);
    expect(result.valid).toBe(true);
  });

  it('rejects item with exact same title and creator', () => {
    const items = [
      createMockItem({ title: 'The Great Gatsby', creator: 'F. Scott Fitzgerald' }),
    ];
    const newItem: CreateItemData = {
      type: 'book',
      title: 'The Great Gatsby',
      creator: 'F. Scott Fitzgerald',
    };
    
    const result = validateNoDuplicateItems(items, newItem);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('This item already exists in the shelf');
  });

  it('rejects duplicate with case-insensitive title comparison', () => {
    const items = [
      createMockItem({ title: 'The Great Gatsby', creator: 'F. Scott Fitzgerald' }),
    ];
    const newItem: CreateItemData = {
      type: 'book',
      title: 'THE GREAT GATSBY',
      creator: 'F. Scott Fitzgerald',
    };
    
    const result = validateNoDuplicateItems(items, newItem);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('This item already exists in the shelf');
  });

  it('rejects duplicate with case-insensitive creator comparison', () => {
    const items = [
      createMockItem({ title: 'The Great Gatsby', creator: 'F. Scott Fitzgerald' }),
    ];
    const newItem: CreateItemData = {
      type: 'book',
      title: 'The Great Gatsby',
      creator: 'f. scott fitzgerald',
    };
    
    const result = validateNoDuplicateItems(items, newItem);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('This item already exists in the shelf');
  });

  it('rejects duplicate ignoring leading/trailing whitespace', () => {
    const items = [
      createMockItem({ title: 'The Great Gatsby', creator: 'F. Scott Fitzgerald' }),
    ];
    const newItem: CreateItemData = {
      type: 'book',
      title: '  The Great Gatsby  ',
      creator: '  F. Scott Fitzgerald  ',
    };
    
    const result = validateNoDuplicateItems(items, newItem);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('This item already exists in the shelf');
  });

  it('allows duplicates of different types', () => {
    const items = [
      createMockItem({ type: 'book', title: 'Test', creator: 'Author' }),
    ];
    const newItem: CreateItemData = {
      type: 'podcast',
      title: 'Test',
      creator: 'Author',
    };
    
    // Different types are allowed to have same title/creator
    const result = validateNoDuplicateItems(items, newItem);
    expect(result.valid).toBe(true);
  });

  it('detects duplicate among multiple items', () => {
    const items = [
      createMockItem({ id: 'item-1', title: 'Book One', creator: 'Author A' }),
      createMockItem({ id: 'item-2', title: 'Book Two', creator: 'Author B' }),
      createMockItem({ id: 'item-3', title: 'Book Three', creator: 'Author C' }),
    ];
    const newItem: CreateItemData = {
      type: 'book',
      title: 'Book Two',
      creator: 'Author B',
    };
    
    const result = validateNoDuplicateItems(items, newItem);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('This item already exists in the shelf');
  });
});

// ============================================================================
// isTop5Shelf Tests
// ============================================================================

describe('isTop5Shelf', () => {
  it('returns true for top5 shelf', () => {
    const shelf = createMockShelf({ shelf_type: 'top5' });
    expect(isTop5Shelf(shelf)).toBe(true);
  });

  it('returns false for standard shelf', () => {
    const shelf = createMockShelf({ shelf_type: 'standard' });
    expect(isTop5Shelf(shelf)).toBe(false);
  });
});

// ============================================================================
// validateShelfType Tests
// ============================================================================

describe('validateShelfType', () => {
  it('accepts "standard" type', () => {
    const result = validateShelfType('standard');
    expect(result.valid).toBe(true);
  });

  it('accepts "top5" type', () => {
    const result = validateShelfType('top5');
    expect(result.valid).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = validateShelfType('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Shelf type must be "standard" or "top5"');
  });

  it('rejects empty string', () => {
    const result = validateShelfType('');
    expect(result.valid).toBe(false);
  });

  it('rejects uppercase variants', () => {
    const result = validateShelfType('TOP5');
    expect(result.valid).toBe(false);
  });
});
