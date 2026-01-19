/**
 * Schema.org JSON-LD markup generator for AI-readable shelf metadata
 * 
 * Generates JSON-LD structured data that helps LLMs and accessibility tools
 * understand shelf contents. Uses schema.org vocabulary for Collection and item types.
 */

import { Item, ItemType, Shelf } from '@/lib/types/shelf';

/**
 * Schema.org types for different item types in Virtual Bookshelf
 */
type SchemaItemType = 'Book' | 'PodcastSeries' | 'MusicRecording' | 'VideoObject' | 'Linkage';

/**
 * Maps Virtual Bookshelf ItemType to schema.org type
 */
function getSchemaType(itemType: ItemType): SchemaItemType {
  const typeMap: Record<ItemType, SchemaItemType> = {
    book: 'Book',
    podcast: 'PodcastSeries',
    podcast_episode: 'PodcastSeries',
    music: 'MusicRecording',
    video: 'VideoObject',
    link: 'Linkage',
  };
  return typeMap[itemType] || 'Linkage';
}

/**
 * Generates schema.org JSON-LD markup for an individual item
 */
function generateItemSchema(item: Item) {
  const schemaType = getSchemaType(item.type);

  const baseSchema = {
    '@type': schemaType,
    name: item.title,
    ...(item.notes && { description: item.notes }),
    ...(item.external_url && { url: item.external_url }),
    ...(item.image_url && { image: item.image_url }),
  };

  // Add creator/author based on type
  if (item.creator) {
    if (schemaType === 'Book') {
      return {
        ...baseSchema,
        author: {
          '@type': 'Person',
          name: item.creator,
        },
      };
    } else if (schemaType === 'MusicRecording') {
      return {
        ...baseSchema,
        byArtist: {
          '@type': 'Person',
          name: item.creator,
        },
      };
    } else if (schemaType === 'PodcastSeries') {
      return {
        ...baseSchema,
        creator: {
          '@type': 'Person',
          name: item.creator,
        },
      };
    } else if (schemaType === 'VideoObject') {
      return {
        ...baseSchema,
        uploadDate: item.created_at?.toISOString(),
        creator: {
          '@type': 'Person',
          name: item.creator,
        },
      };
    }
  }

  return baseSchema;
}

/**
 * Generates complete JSON-LD markup for a shelf
 * 
 * @param shelf - The shelf object containing name, description, etc.
 * @param items - Array of items in the shelf
 * @param username - Username of the shelf owner
 * @returns JSON-LD object ready for serialization
 */
export function generateShelfSchema(
  shelf: Shelf,
  items: Item[],
  username?: string | null
): Record<string, unknown> {
  const itemListElement = items
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => generateItemSchema(item));

  return {
    '@context': 'https://schema.org',
    '@type': 'Collection',
    name: shelf.name,
    ...(shelf.description && { description: shelf.description }),
    ...(username && {
      creator: {
        '@type': 'Person',
        name: username,
      },
    }),
    datePublished: shelf.created_at?.toISOString(),
    dateModified: shelf.updated_at?.toISOString(),
    itemListElement,
    numberOfItems: items.length,
  };
}

/**
 * Generates JSON-LD script tag markup as a string
 * Ready to be embedded in page head
 * 
 * @param shelf - The shelf object
 * @param items - Array of items in the shelf
 * @param username - Username of the shelf owner
 * @returns JSON string of schema markup
 */
export function generateShelfSchemaJson(
  shelf: Shelf,
  items: Item[],
  username?: string | null
): string {
  const schema = generateShelfSchema(shelf, items, username);
  return JSON.stringify(schema, null, 2);
}
