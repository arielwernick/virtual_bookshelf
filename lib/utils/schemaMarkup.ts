/**
 * Schema.org JSON-LD markup generator for AI-readable shelf metadata
 * 
 * Generates JSON-LD structured data that helps LLMs and accessibility tools
 * understand shelf contents. Uses schema.org vocabulary for Collection and item types.
 */

import { Item, ItemType, Shelf } from '@/lib/types/shelf';
import { extractVideoId } from '@/lib/api/youtube';

type SchemaItemType = 'Book' | 'PodcastSeries' | 'MusicRecording' | 'VideoObject' | 'Linkage';
type SchemaObject = Record<string, unknown>;

const SCHEMA_TYPE_MAP: Record<ItemType, SchemaItemType> = {
  book: 'Book',
  podcast: 'PodcastSeries',
  podcast_episode: 'PodcastSeries',
  music: 'MusicRecording',
  video: 'VideoObject',
  link: 'Linkage',
  stock: 'Linkage',
};

const CREATOR_PROPERTY_MAP: Record<SchemaItemType, string> = {
  Book: 'author',
  MusicRecording: 'byArtist',
  PodcastSeries: 'creator',
  VideoObject: 'creator',
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
  const videoSchema: SchemaObject = { ...schema };

  // Google requires `thumbnailUrl` for VideoObject rich results. The base schema
  // sets `image`, but that field does not satisfy the VideoObject requirement.
  if (item.image_url) videoSchema.thumbnailUrl = item.image_url;

  // Provide `embedUrl` (recommended) for YouTube videos so the player can be
  // surfaced in rich results.
  if (item.external_url) {
    const videoId = extractVideoId(item.external_url);
    if (videoId) videoSchema.embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  if (item.created_at) videoSchema.uploadDate = item.created_at.toISOString();

  return videoSchema;
}

function generateItemSchema(item: Item, index: number): SchemaObject {
  const schemaType = getSchemaType(item.type);
  let schema = createBaseSchema(item, schemaType);
  
  schema = addCreatorToSchema(schema, item, schemaType);
  
  if (schemaType === 'VideoObject') {
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
