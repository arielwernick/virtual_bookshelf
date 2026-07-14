import { describe, it, expect } from 'vitest';
import {
  generateShelfSchema,
  generateVideoObjectSchema,
} from './schemaMarkup';
import { Item, ItemType, Shelf } from '@/lib/types/shelf';

function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'video',
    title: 'The 2022 Crypto Crash, Explained',
    creator: 'Some Channel',
    image_url: 'https://example.com/thumb.jpg',
    external_url: 'https://www.youtube.com/watch?v=woEN59Gs123',
    notes: 'A great explainer',
    rating: null,
    order_index: 0,
    created_at: new Date('2026-01-15T00:00:00Z'),
    updated_at: new Date('2026-01-15T00:00:00Z'),
    ...overrides,
  };
}

function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'My Shelf',
    description: 'A shelf',
    share_token: 'my-shelf-abc',
    is_public: true,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-10T00:00:00Z'),
    ...overrides,
  } as Shelf;
}

function getFirstItemSchema(shelf: Shelf, items: Item[]): Record<string, unknown> {
  const schema = generateShelfSchema(shelf, items) as Record<string, unknown>;
  const list = schema.itemListElement as Array<Record<string, unknown>>;
  return list[0].item as Record<string, unknown>;
}

describe('generateShelfSchema (collection page)', () => {
  it('serializes video items as CreativeWork, never VideoObject', () => {
    const shelf = createMockShelf();
    const items = [createMockItem()];
    const schema = generateShelfSchema(shelf, items, 'user');

    const listItem = (schema.itemListElement as Record<string, unknown>[])[0];
    const inner = listItem.item as Record<string, unknown>;

    expect(inner['@type']).toBe('CreativeWork');
    // The whole collection must not claim VideoObject anywhere — that's what
    // triggered "Video isn't on a watch page" in Search Console. VideoObject
    // now lives only on the dedicated /v/[videoId] watch pages.
    expect(JSON.stringify(schema)).not.toContain('VideoObject');
  });

  it('uses dateCreated (not the VideoObject-only uploadDate) for video items', () => {
    const item = createMockItem();
    const inner = getFirstItemSchema(createMockShelf(), [item]);

    expect(inner.dateCreated).toBe(item.created_at.toISOString());
    expect(inner.uploadDate).toBeUndefined();
  });

  it('does not add video metadata to non-video items', () => {
    const item = createMockItem({ type: 'book' as ItemType });
    const inner = getFirstItemSchema(createMockShelf(), [item]);

    expect(inner['@type']).toBe('Book');
    expect(inner.dateCreated).toBeUndefined();
  });
});

describe('generateVideoObjectSchema (watch page)', () => {
  const opts = {
    embedUrl: 'https://www.youtube.com/embed/woEN59Gs123',
    contentUrl: 'https://www.youtube.com/watch?v=woEN59Gs123',
    thumbnailUrl: 'https://img.youtube.com/vi/woEN59Gs123/hqdefault.jpg',
  };

  it('emits a VideoObject with all Google-required fields', () => {
    const item = createMockItem();
    const schema = generateVideoObjectSchema(item, opts);

    expect(schema['@type']).toBe('VideoObject');
    expect(schema.name).toBe(item.title);
    expect(schema.thumbnailUrl).toBe(opts.thumbnailUrl);
    expect(schema.uploadDate).toBe(item.created_at.toISOString());
    expect(schema.embedUrl).toBe(opts.embedUrl);
    expect(schema.contentUrl).toBe(opts.contentUrl);
  });

  it('includes description and creator when present, omits when absent', () => {
    const withMeta = generateVideoObjectSchema(createMockItem(), opts);
    expect(withMeta.description).toBe('A great explainer');
    expect(withMeta.creator).toMatchObject({ '@type': 'Person', name: 'Some Channel' });

    const withoutMeta = generateVideoObjectSchema(
      createMockItem({ notes: null, creator: '' }),
      opts
    );
    expect(withoutMeta.description).toBeUndefined();
    expect(withoutMeta.creator).toBeUndefined();
  });
});
