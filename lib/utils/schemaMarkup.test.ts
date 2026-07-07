import { describe, it, expect } from 'vitest';
import { generateShelfSchema } from './schemaMarkup';
import { Item, ItemType, Shelf } from '@/lib/types/shelf';

function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'Crypto Explainers',
    description: 'The 2022 crypto crash, explained',
    share_token: 'woEN59Gs',
    is_public: true,
    created_at: new Date('2026-07-07T12:00:00Z'),
    updated_at: new Date('2026-07-07T12:00:00Z'),
    ...overrides,
  };
}

function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'video' as ItemType,
    title: 'The FTX Collapse, Explained | What Went Wrong',
    creator: 'Wall Street Journal',
    image_url: 'https://img.youtube.com/vi/AbgRB3arCpY/hqdefault.jpg',
    external_url: 'https://www.youtube.com/watch?v=AbgRB3arCpY',
    notes: 'The tightest version of the FTX story.',
    rating: null,
    order_index: 0,
    created_at: new Date('2026-07-07T12:45:44Z'),
    updated_at: new Date('2026-07-07T12:45:44Z'),
    ...overrides,
  };
}

function getFirstItemSchema(shelf: Shelf, items: Item[]): Record<string, unknown> {
  const schema = generateShelfSchema(shelf, items) as Record<string, unknown>;
  const list = schema.itemListElement as Array<Record<string, unknown>>;
  return list[0].item as Record<string, unknown>;
}

describe('schemaMarkup - VideoObject', () => {
  it('includes thumbnailUrl (required by Google) from image_url', () => {
    const item = createMockItem();
    const itemSchema = getFirstItemSchema(createMockShelf(), [item]);

    expect(itemSchema['@type']).toBe('VideoObject');
    expect(itemSchema.thumbnailUrl).toBe(
      'https://img.youtube.com/vi/AbgRB3arCpY/hqdefault.jpg'
    );
  });

  it('derives embedUrl from a YouTube watch URL', () => {
    const item = createMockItem();
    const itemSchema = getFirstItemSchema(createMockShelf(), [item]);

    expect(itemSchema.embedUrl).toBe(
      'https://www.youtube.com/embed/AbgRB3arCpY'
    );
  });

  it('still includes uploadDate', () => {
    const item = createMockItem();
    const itemSchema = getFirstItemSchema(createMockShelf(), [item]);

    expect(itemSchema.uploadDate).toBe('2026-07-07T12:45:44.000Z');
  });

  it('omits thumbnailUrl when the video has no image', () => {
    const item = createMockItem({ image_url: null });
    const itemSchema = getFirstItemSchema(createMockShelf(), [item]);

    expect(itemSchema.thumbnailUrl).toBeUndefined();
  });

  it('omits embedUrl for non-YouTube video URLs', () => {
    const item = createMockItem({
      external_url: 'https://vimeo.com/123456789',
    });
    const itemSchema = getFirstItemSchema(createMockShelf(), [item]);

    expect(itemSchema.embedUrl).toBeUndefined();
  });

  it('does not add video metadata to non-video items', () => {
    const item = createMockItem({ type: 'book' as ItemType });
    const itemSchema = getFirstItemSchema(createMockShelf(), [item]);

    expect(itemSchema['@type']).toBe('Book');
    expect(itemSchema.thumbnailUrl).toBeUndefined();
    expect(itemSchema.embedUrl).toBeUndefined();
  });
});
