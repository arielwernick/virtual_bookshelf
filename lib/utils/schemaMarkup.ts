/**
 * Schema.org JSON-LD markup generator for AI-readable shelf metadata
 *
 * A public shelf is a CollectionPage whose main entity is an ordered ItemList.
 * Every `@type` emitted here exists on schema.org: parsers silently drop types
 * they don't know, so an invented type hides the item (issue #283).
 */

import { Item, ItemType, Shelf } from '@/lib/types/shelf';

type SchemaObject = Record<string, unknown>;

// Note: video items use 'CreativeWork', not 'VideoObject'. A shelf is a
// collection (ItemList) of many items, not a video "watch page" where a single
// video is the main, playable content. Declaring VideoObject here caused Google
// Search Console to report "Video isn't on a watch page" for every shelf that
// contained a video — the videos could never be indexed as video results, and
// the warning persisted. CreativeWork describes the item honestly without
// claiming video-indexing eligibility.
function getSchemaType(item: Item): string {
  switch (item.type) {
    case 'book':
      return 'Book';
    case 'podcast':
      return 'PodcastSeries';
    case 'podcast_episode':
      return 'PodcastEpisode';
    case 'music':
      // The item type doesn't say album or track; the Spotify URL does.
      return item.external_url?.includes('/album/') ? 'MusicAlbum' : 'MusicRecording';
    case 'video':
      return 'CreativeWork';
    case 'stock':
      return 'Corporation';
    case 'link':
    default:
      return 'WebPage';
  }
}

/**
 * The `creator` column holds different things per item type. Map each to the
 * property and entity type that is true for it, rather than calling
 * everything a Person.
 */
function creatorProperties(item: Item): SchemaObject {
  if (!item.creator) return {};

  switch (item.type as ItemType) {
    case 'book':
      return { author: { '@type': 'Person', name: item.creator } };
    case 'music':
      // schema.org: a MusicGroup "can also be a solo musician".
      return { byArtist: { '@type': 'MusicGroup', name: item.creator } };
    case 'podcast_episode':
      // For episodes the creator column is the show name.
      return { partOfSeries: { '@type': 'PodcastSeries', name: item.creator } };
    case 'stock':
      // For stocks the creator column is the ticker symbol.
      return { tickerSymbol: item.creator };
    case 'podcast':
    case 'video':
    case 'link':
    default:
      // Publishers, channels and site names: an Organization is the closer fit.
      return { creator: { '@type': 'Organization', name: item.creator } };
  }
}

/**
 * A curator's note and rating are the curator's words about the work, not a
 * description of the work, so they are a Review. The reviewer is deliberately
 * unnamed: usernames are never published on public pages.
 */
function reviewProperties(item: Item): SchemaObject {
  const hasRating = typeof item.rating === 'number' && item.rating > 0;
  if (!item.notes && !hasRating) return {};

  const review: SchemaObject = { '@type': 'Review' };
  if (item.notes) review.reviewBody = item.notes;
  if (hasRating) {
    review.reviewRating = {
      '@type': 'Rating',
      ratingValue: item.rating,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return { review };
}

function generateItemSchema(item: Item, index: number): SchemaObject {
  const schema: SchemaObject = {
    '@type': getSchemaType(item),
    name: item.title,
  };

  if (item.external_url) schema.url = item.external_url;
  if (item.image_url) schema.image = item.image_url;

  Object.assign(schema, creatorProperties(item), reviewProperties(item));

  return {
    '@type': 'ListItem',
    position: index + 1,
    item: schema,
  };
}

function sortItemsByOrder(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.order_index - b.order_index);
}

export interface ShelfSchemaOptions {
  /** Absolute canonical URL of the shelf page; becomes `url` and `@id`. */
  url?: string;
}

// The owner is deliberately left out: usernames for Google sign-ups are derived
// from the email address, so publishing one can reveal part of that address.
export function generateShelfSchema(
  shelf: Shelf,
  items: Item[],
  options: ShelfSchemaOptions = {}
): SchemaObject {
  const itemSchemas = sortItemsByOrder(items).map((item, index) =>
    generateItemSchema(item, index)
  );

  const page: SchemaObject = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: shelf.name,
  };

  if (options.url) {
    page['@id'] = options.url;
    page.url = options.url;
  }
  if (shelf.description) page.description = shelf.description;
  if (shelf.created_at) page.datePublished = shelf.created_at.toISOString();
  if (shelf.updated_at) page.dateModified = shelf.updated_at.toISOString();

  page.mainEntity = {
    '@type': 'ItemList',
    name: shelf.name,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: itemSchemas.length,
    itemListElement: itemSchemas,
  };

  return page;
}

/**
 * Serialize JSON-LD for inlining in a <script> element.
 *
 * JSON.stringify alone is not enough there: shelf names, titles and notes are
 * user text, and a literal "</script>" inside one would end the element early.
 * Escaping these characters keeps the JSON identical once parsed.
 */
export function serializeJsonLd(schema: SchemaObject): string {
  return JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function generateShelfSchemaJson(
  shelf: Shelf,
  items: Item[],
  options: ShelfSchemaOptions = {}
): string {
  return serializeJsonLd(generateShelfSchema(shelf, items, options));
}

/**
 * Full VideoObject markup for a dedicated /v/[videoId] watch page.
 *
 * Unlike the collection page (which uses CreativeWork — see getSchemaType),
 * the watch page IS a real watch page: a single video that is the main,
 * embedded, playable content. That makes VideoObject appropriate and eligible
 * for Google video results. Required fields (name, thumbnailUrl, uploadDate)
 * are always emitted; embedUrl/contentUrl/description are added when available.
 */
export function generateVideoObjectSchema(
  item: Item,
  opts: { embedUrl: string; contentUrl: string; thumbnailUrl: string }
): SchemaObject {
  const schema: SchemaObject = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: item.title,
    thumbnailUrl: opts.thumbnailUrl,
    embedUrl: opts.embedUrl,
    contentUrl: opts.contentUrl,
    // Best available date: when the video was added to the shelf. Not the
    // original YouTube upload date (not stored), but a valid required value.
    uploadDate: item.created_at.toISOString(),
  };

  if (item.notes) schema.description = item.notes;
  if (item.creator) schema.creator = { '@type': 'Organization', name: item.creator };

  return schema;
}

export function generateVideoObjectSchemaJson(
  item: Item,
  opts: { embedUrl: string; contentUrl: string; thumbnailUrl: string }
): string {
  return serializeJsonLd(generateVideoObjectSchema(item, opts));
}
