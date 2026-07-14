/**
 * Schema.org JSON-LD markup generator for AI-readable shelf metadata
 * 
 * Generates JSON-LD structured data that helps LLMs and accessibility tools
 * understand shelf contents. Uses schema.org vocabulary for Collection and item types.
 */

import { Item, ItemType, Shelf } from '@/lib/types/shelf';

type SchemaItemType = 'Book' | 'PodcastSeries' | 'MusicRecording' | 'CreativeWork' | 'Linkage';
type SchemaObject = Record<string, unknown>;

// Note: video items use 'CreativeWork', not 'VideoObject'. A shelf is a
// collection (ItemList) of many items, not a video "watch page" where a single
// video is the main, playable content. Declaring VideoObject here caused Google
// Search Console to report "Video isn't on a watch page" for every shelf that
// contained a video — the videos could never be indexed as video results, and
// the warning persisted. CreativeWork describes the item honestly without
// claiming video-indexing eligibility.
const SCHEMA_TYPE_MAP: Record<ItemType, SchemaItemType> = {
  book: 'Book',
  podcast: 'PodcastSeries',
  podcast_episode: 'PodcastSeries',
  music: 'MusicRecording',
  video: 'CreativeWork',
  link: 'Linkage',
  stock: 'Linkage',
};

const CREATOR_PROPERTY_MAP: Record<SchemaItemType, string> = {
  Book: 'author',
  MusicRecording: 'byArtist',
  PodcastSeries: 'creator',
  CreativeWork: 'creator',
  Linkage: 'creator',
};

function getSchemaType(itemType: ItemType): SchemaItemType {
  return SCHEMA_TYPE_MAP[itemType] || 'Linkage';
}

function createPersonObject(name: string): SchemaObject {
  return {
    '@type': 'Person',
    name,
  };
}

function createBaseSchema(item: Item, schemaType: SchemaItemType): SchemaObject {
  const schema: SchemaObject = {
    '@type': schemaType,
    name: item.title,
  };

  if (item.notes) schema.description = item.notes;
  if (item.external_url) schema.url = item.external_url;
  if (item.image_url) schema.image = item.image_url;

  return schema;
}

function addCreatorToSchema(schema: SchemaObject, item: Item, schemaType: SchemaItemType): SchemaObject {
  if (!item.creator) return schema;

  const creatorProperty = CREATOR_PROPERTY_MAP[schemaType];
  if (!creatorProperty) return schema;

  const creatorObject = createPersonObject(item.creator);

  return {
    ...schema,
    [creatorProperty]: creatorObject,
  };
}

function addVideoMetadata(schema: SchemaObject, item: Item): SchemaObject {
  if (!item.created_at) return schema;

  return {
    ...schema,
    dateCreated: item.created_at.toISOString(),
  };
}

function generateItemSchema(item: Item, index: number): SchemaObject {
  const schemaType = getSchemaType(item.type);
  let schema = createBaseSchema(item, schemaType);
  
  schema = addCreatorToSchema(schema, item, schemaType);
  
  if (item.type === 'video') {
    schema = addVideoMetadata(schema, item);
  }

  // Wrap in ListItem for proper schema.org Collection structure
  return {
    '@type': 'ListItem',
    position: index + 1,
    item: schema,
  };
}

function sortItemsByOrder(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.order_index - b.order_index);
}

function createCollectionSchema(shelf: Shelf, itemSchemas: SchemaObject[], username?: string | null): SchemaObject {
  const schema: SchemaObject = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: shelf.name,
    itemListElement: itemSchemas,
    numberOfItems: itemSchemas.length,
  };

  if (shelf.description) schema.description = shelf.description;
  if (shelf.created_at) schema.datePublished = shelf.created_at.toISOString();
  if (shelf.updated_at) schema.dateModified = shelf.updated_at.toISOString();
  if (username) schema.creator = createPersonObject(username);

  return schema;
}

export function generateShelfSchema(
  shelf: Shelf,
  items: Item[],
  username?: string | null
): SchemaObject {
  const sortedItems = sortItemsByOrder(items);
  const itemSchemas = sortedItems.map((item, index) => generateItemSchema(item, index));
  return createCollectionSchema(shelf, itemSchemas, username);
}

export function generateShelfSchemaJson(
  shelf: Shelf,
  items: Item[],
  username?: string | null
): string {
  const schema = generateShelfSchema(shelf, items, username);
  return JSON.stringify(schema, null, 2);
}

/**
 * Full VideoObject markup for a dedicated /v/[videoId] watch page.
 *
 * Unlike the collection page (which uses CreativeWork — see SCHEMA_TYPE_MAP),
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
  if (item.creator) schema.creator = createPersonObject(item.creator);

  return schema;
}

export function generateVideoObjectSchemaJson(
  item: Item,
  opts: { embedUrl: string; contentUrl: string; thumbnailUrl: string }
): string {
  return JSON.stringify(generateVideoObjectSchema(item, opts), null, 2);
}
