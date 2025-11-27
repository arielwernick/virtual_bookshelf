/**
 * Seed script to create a demo account with a public shelf
 * 
 * Run with: npx tsx scripts/seed-demo.ts
 * 
 * This creates:
 * - A demo user account (demo@virtualbookshelf.app)
 * - A public shelf with sample books, podcasts, and music
 * - Outputs the share token to use in DEMO_SHELF_TOKEN env var
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { sql } from '../lib/db/client';
import { hashPassword } from '../lib/utils/password';

const DEMO_EMAIL = 'demo@virtualbookshelf.app';
const DEMO_USERNAME = 'demo';
const DEMO_PASSWORD = 'demo123456'; // Not meant to be secure, just for seeding

const DEMO_SHELF_NAME = 'My Recommendations';
const DEMO_SHELF_DESCRIPTION = 'A collection of books, podcasts, and music I love.';

// Sample items for the demo shelf
const DEMO_ITEMS = [
  // Books
  {
    type: 'book',
    title: 'Atomic Habits',
    creator: 'James Clear',
    image_url: 'https://books.google.com/books/content?id=XfFvDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
    external_url: 'https://www.google.com/books/edition/Atomic_Habits/XfFvDwAAQBAJ',
  },
  {
    type: 'book',
    title: 'Deep Work',
    creator: 'Cal Newport',
    image_url: 'https://books.google.com/books/content?id=4QTzCAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
    external_url: 'https://www.google.com/books/edition/Deep_Work/4QTzCAAAQBAJ',
  },
  {
    type: 'book',
    title: 'The Psychology of Money',
    creator: 'Morgan Housel',
    image_url: 'https://books.google.com/books/content?id=TnrrDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
    external_url: 'https://www.google.com/books/edition/The_Psychology_of_Money/TnrrDwAAQBAJ',
  },
  {
    type: 'book',
    title: 'Thinking, Fast and Slow',
    creator: 'Daniel Kahneman',
    image_url: 'https://books.google.com/books/content?id=ZuKTvERuPG8C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
    external_url: 'https://www.google.com/books/edition/Thinking_Fast_and_Slow/ZuKTvERuPG8C',
  },
  // Podcasts
  {
    type: 'podcast',
    title: 'Huberman Lab',
    creator: 'Andrew Huberman',
    image_url: 'https://i.scdn.co/image/ab6765630000ba8a7250fabfb5b3bd7e914f4d82',
    external_url: 'https://open.spotify.com/show/79CkJF3UJTHFV8Dse3Ez0S',
  },
  {
    type: 'podcast',
    title: 'Lex Fridman Podcast',
    creator: 'Lex Fridman',
    image_url: 'https://i.scdn.co/image/ab6765630000ba8a563ebb538d297875b10114b7',
    external_url: 'https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL',
  },
  {
    type: 'podcast',
    title: 'The Tim Ferriss Show',
    creator: 'Tim Ferriss',
    image_url: 'https://i.scdn.co/image/ab6765630000ba8a87399bbfcc81d3eb3f990339',
    external_url: 'https://open.spotify.com/show/5qSUyCrk9KR69lEiXbjwXM',
  },
  // Music
  {
    type: 'music',
    title: 'Random Access Memories',
    creator: 'Daft Punk',
    image_url: 'https://i.scdn.co/image/ab67616d0000b2739b9b36b0e22870b9f542d937',
    external_url: 'https://open.spotify.com/album/4m2880jivSbbyEGAKfITCa',
  },
  {
    type: 'music',
    title: 'Kind of Blue',
    creator: 'Miles Davis',
    image_url: 'https://i.scdn.co/image/ab67616d0000b273b9e0c87afe19234d939a7095',
    external_url: 'https://open.spotify.com/album/1weenld61qoidwYuZ1GESA',
  },
];

async function seedDemo() {
  console.log('🌱 Starting demo seed...\n');

  try {
    // Check if demo user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${DEMO_EMAIL}
    `;

    let userId: string;

    if (existingUser.length > 0) {
      console.log('📧 Demo user already exists, using existing account');
      userId = existingUser[0].id;

      // Delete existing demo shelves to start fresh
      await sql`
        DELETE FROM shelves WHERE user_id = ${userId}
      `;
      console.log('🗑️  Cleared existing demo shelves');
    } else {
      // Create demo user
      const passwordHash = await hashPassword(DEMO_PASSWORD);
      const newUser = await sql`
        INSERT INTO users (username, email, password_hash)
        VALUES (${DEMO_USERNAME}, ${DEMO_EMAIL}, ${passwordHash})
        RETURNING id
      `;
      userId = newUser[0].id;
      console.log('👤 Created demo user:', DEMO_EMAIL);
    }

    // Create demo shelf
    const newShelf = await sql`
      INSERT INTO shelves (user_id, name, description, is_public)
      VALUES (${userId}, ${DEMO_SHELF_NAME}, ${DEMO_SHELF_DESCRIPTION}, true)
      RETURNING id, share_token
    `;

    const shelfId = newShelf[0].id;
    const shareToken = newShelf[0].share_token;

    console.log('📚 Created demo shelf:', DEMO_SHELF_NAME);

    // Add demo items
    for (let i = 0; i < DEMO_ITEMS.length; i++) {
      const item = DEMO_ITEMS[i];
      await sql`
        INSERT INTO items (shelf_id, user_id, type, title, creator, image_url, external_url, order_index)
        VALUES (${shelfId}, ${userId}, ${item.type}, ${item.title}, ${item.creator}, ${item.image_url}, ${item.external_url}, ${i})
      `;
    }

    console.log(`✅ Added ${DEMO_ITEMS.length} demo items\n`);

    // Output the share token
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Demo seed complete!\n');
    console.log('Add this to your .env.local file:');
    console.log(`DEMO_SHELF_TOKEN=${shareToken}`);
    console.log('\nView the demo shelf at:');
    console.log(`http://localhost:3000/s/${shareToken}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedDemo();
