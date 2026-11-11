import { describe, it, expect } from 'vitest';
import {
  generateShelfSchema,
  generateShelfSchemaJson,
  generateVideoObjectSchema,
  generateVideoObjectSchemaJson,
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

function getList(schema: Record<string, unknown>): Array<Record<string, unknown>> {
  const list = schema.mainEntity as Record<string, unknown>;
  return list.itemListElement as Array<Record<string, unknown>>;
}

function getFirstItemSchema(shelf: Shelf, items: Item[]): Record<string, unknown> {
  return getList(generateShelfSchema(shelf, items))[0].item as Record<string, unknown>;
}

// Every type the generator may emit. All exist on schema.org.
const VALID_TYPES = new Set([
  'CollectionPage', 'ItemList', 'ListItem', 'Book', 'PodcastSeries', 'PodcastEpisode',
  'MusicAlbum', 'MusicRecording', 'CreativeWork', 'WebPage', 'Corporation',
  'Person', 'Organization', 'MusicGroup', 'Review', 'Rating',
]);

function collectTypes(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((v) => collectTypes(v, found));
  } else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      if (key === '@type') found.push(v as string);
      else collectTypes(v, found);
    }
  }
  return found;
}

describe('generateShelfSchema (collection page)', () => {
  it('is a CollectionPage whose main entity is an ordered ItemList', () => {
    const url = 'https://virtualbookshelf.app/s/my-shelf-abc';
    const schema = generateShelfSchema(createMockShelf(), [createMockItem()], { url });
    const list = schema.mainEntity as Record<string, unknown>;

    expect(schema['@type']).toBe('CollectionPage');
    expect(schema['@id']).toBe(url);
    expect(schema.url).toBe(url);
    expect(list['@type']).toBe('ItemList');
    expect(list.numberOfItems).toBe(1);
  });

  it('orders list items by order_index', () => {
    const schema = generateShelfSchema(createMockShelf(), [
      createMockItem({ id: 'b', title: 'Second', order_index: 1 }),
      createMockItem({ id: 'a', title: 'First', order_index: 0 }),
    ]);
    const names = getList(schema).map((li) => (li.item as Record<string, unknown>).name);

    expect(names).toEqual(['First', 'Second']);
    expect(getList(schema)[1].position).toBe(2);
  });

  it('only emits types that exist on schema.org, for every item type', () => {
    const types: ItemType[] = ['book', 'podcast', 'podcast_episode', 'music', 'video', 'link', 'stock'];
    const items = types.map((type, i) =>
      createMockItem({ id: `i${i}`, type, order_index: i, rating: 4 })
    );
    const found = collectTypes(generateShelfSchema(createMockShelf(), items));

    expect(found).not.toContain('Linkage');
    for (const type of found) expect(VALID_TYPES.has(type)).toBe(true);
  });

  it.each([
    ['book', 'Book'],
    ['podcast', 'PodcastSeries'],
    ['podcast_episode', 'PodcastEpisode'],
    ['link', 'WebPage'],
    ['stock', 'Corporation'],
  ] as Array<[ItemType, string]>)('maps %s to %s', (type, expected) => {
    const inner = getFirstItemSchema(createMockShelf(), [createMockItem({ type })]);
    expect(inner['@type']).toBe(expected);
  });

  it('tells albums from tracks by the URL', () => {
    const album = getFirstItemSchema(createMockShelf(), [
      createMockItem({ type: 'music', external_url: 'https://open.spotify.com/album/abc' }),
    ]);
    const track = getFirstItemSchema(createMockShelf(), [
      createMockItem({ type: 'music', external_url: 'https://open.spotify.com/track/abc' }),
    ]);

    expect(album['@type']).toBe('MusicAlbum');
    expect(track['@type']).toBe('MusicRecording');
  });

  it('serializes video items as CreativeWork, never VideoObject', () => {
    const schema = generateShelfSchema(createMockShelf(), [createMockItem()]);

    expect(getFirstItemSchema(createMockShelf(), [createMockItem()])['@type']).toBe('CreativeWork');
    // The whole collection must not claim VideoObject anywhere — that's what
    // triggered "Video isn't on a watch page" in Search Console. VideoObject
    // now lives only on the dedicated /v/[videoId] watch pages.
    expect(JSON.stringify(schema)).not.toContain('VideoObject');
  });

  it('does not name the shelf owner, but keeps per-item creators', () => {
    const schema = generateShelfSchema(createMockShelf(), [createMockItem({ creator: 'Some Channel' })]);
    const inner = getList(schema)[0].item as Record<string, unknown>;

    expect(schema.creator).toBeUndefined();
    expect(schema.author).toBeUndefined();
    expect(inner.creator).toMatchObject({ '@type': 'Organization', name: 'Some Channel' });
  });

  it('uses the right creator property per item type', () => {
    const shelf = createMockShelf();
    const book = getFirstItemSchema(shelf, [createMockItem({ type: 'book', creator: 'Ursula K. Le Guin' })]);
    const music = getFirstItemSchema(shelf, [createMockItem({ type: 'music', creator: 'Radiohead' })]);
    const episode = getFirstItemSchema(shelf, [createMockItem({ type: 'podcast_episode', creator: 'The Show' })]);
    const stock = getFirstItemSchema(shelf, [createMockItem({ type: 'stock', creator: 'AAPL' })]);

    expect(book.author).toEqual({ '@type': 'Person', name: 'Ursula K. Le Guin' });
    expect(music.byArtist).toEqual({ '@type': 'MusicGroup', name: 'Radiohead' });
    expect(episode.partOfSeries).toEqual({ '@type': 'PodcastSeries', name: 'The Show' });
    expect(stock.tickerSymbol).toBe('AAPL');
  });

  it('emits the curator note as a Review, not as the work description', () => {
    const inner = getFirstItemSchema(createMockShelf(), [
      createMockItem({ notes: 'Changed how I plan my week', rating: 5 }),
    ]);
    const review = inner.review as Record<string, unknown>;

    expect(inner.description).toBeUndefined();
    expect(review['@type']).toBe('Review');
    expect(review.reviewBody).toBe('Changed how I plan my week');
    expect(review.reviewRating).toMatchObject({ ratingValue: 5, bestRating: 5 });
    expect(review.author).toBeUndefined();
  });

  it('adds sameAs from the canonical identifier when it differs from the link', () => {
    const inner = getFirstItemSchema(createMockShelf(), [
      createMockItem({
        type: 'book',
        external_url: 'http://books.google.com/books?id=zyTCAlFPjgYC&dq=x&source=gbs_api',
        source: 'google_books',
        source_id: 'zyTCAlFPjgYC',
      }),
    ]);
    const plain = getFirstItemSchema(createMockShelf(), [createMockItem({ type: 'link' })]);

    expect(inner.sameAs).toBe('https://books.google.com/books?id=zyTCAlFPjgYC');
    expect(plain.sameAs).toBeUndefined();
  });

  it('omits the review when there is no note and no rating', () => {
    const inner = getFirstItemSchema(createMockShelf(), [createMockItem({ notes: null, rating: null })]);
    expect(inner.review).toBeUndefined();
  });

  it('does not claim a creation date for the work', () => {
    const inner = getFirstItemSchema(createMockShelf(), [createMockItem()]);

    expect(inner.dateCreated).toBeUndefined();
    expect(inner.uploadDate).toBeUndefined();
  });
});

describe('serializeJsonLd', () => {
  it('cannot be ended early by user text, and parses back unchanged', () => {
    const shelf = createMockShelf({ name: 'Books </script><script>alert(1)</script> & more' });
    const item = createMockItem({ notes: '<!-- note -->   line' });
    const json = generateShelfSchemaJson(shelf, [item]);

    expect(json).not.toContain('<');
    expect(json).not.toContain('>');
    expect(json).not.toContain('&');
    expect(json).not.toContain(' ');
    expect(JSON.parse(json)).toEqual(generateShelfSchema(shelf, [item]));
  });

  it('escapes the watch page markup the same way', () => {
    const json = generateVideoObjectSchemaJson(createMockItem({ title: '</script>' }), {
      embedUrl: 'https://www.youtube.com/embed/x',
      contentUrl: 'https://www.youtube.com/watch?v=x',
      thumbnailUrl: 'https://img.youtube.com/vi/x/hqdefault.jpg',
    });
    expect(json).not.toContain('<');
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
    expect(withMeta.creator).toMatchObject({ '@type': 'Organization', name: 'Some Channel' });

    const withoutMeta = generateVideoObjectSchema(
      createMockItem({ notes: null, creator: '' }),
      opts
    );
    expect(withoutMeta.description).toBeUndefined();
    expect(withoutMeta.creator).toBeUndefined();
  });
});
