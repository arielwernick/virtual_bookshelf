/**
 * Test script to visualize the JSON-LD schema output
 * Run with: npx tsx test-schema-output.ts
 */

import { generateShelfSchemaJson } from '@/lib/utils/schemaMarkup';
import type { Shelf, Item } from '@/lib/types/shelf';

// Mock shelf data
const mockShelf: Shelf = {
  id: 'shelf-123',
  user_id: 'user-456',
  name: 'My Favorite Books',
  description: 'A curated collection of books that changed my perspective',
  share_token: 'abc123xyz',
  is_public: true,
  created_at: new Date('2026-01-20'),
  updated_at: new Date('2026-01-27'),
};

// Mock items
const mockItems: Item[] = [
  {
    id: 'item-1',
    shelf_id: 'shelf-123',
    user_id: 'user-456',
    type: 'book',
    title: 'The Great Gatsby',
    creator: 'F. Scott Fitzgerald',
    image_url: 'https://example.com/gatsby.jpg',
    external_url: 'https://www.goodreads.com/book/show/4671.The_Great_Gatsby',
    notes: 'A masterpiece about the American Dream and its discontents',
    rating: 5,
    order_index: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'item-2',
    shelf_id: 'shelf-123',
    user_id: 'user-456',
    type: 'podcast',
    title: 'The Daily Show',
    creator: 'Trevor Noah',
    image_url: 'https://example.com/daily.jpg',
    external_url: null,
    notes: 'Sharp social commentary and humor about current events',
    rating: 4,
    order_index: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'item-3',
    shelf_id: 'shelf-123',
    user_id: 'user-456',
    type: 'music',
    title: 'Rumours',
    creator: 'Fleetwood Mac',
    image_url: 'https://example.com/rumours.jpg',
    external_url: 'https://open.spotify.com/album/3r1X...',
    notes: 'A timeless classic that defined an era',
    rating: 5,
    order_index: 2,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// Generate schema with username
const username = 'john_doe';
const schemaJson = generateShelfSchemaJson(mockShelf, mockItems, username);

console.log('Generated JSON-LD Schema:');
console.log('========================\n');
console.log(schemaJson);
console.log('\n\nThis is what ChatGPT will see when visiting your shared shelf link.');
console.log('It includes:');
console.log('  - Shelf name, description, and creator');
console.log('  - All items with their metadata (type, title, creator, notes, URL)');
console.log('  - Proper schema.org markup for Collection and ListItem');
