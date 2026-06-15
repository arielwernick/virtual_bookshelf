/**
 * Seed curated demo shelves for the landing page.
 *
 * Creates (or refreshes) a single admin account and a set of public sample
 * shelves that span every item type the app supports — books, podcasts,
 * podcast episodes, music, videos, links, and live stock tickers. These shelves
 * are surfaced on the home page via the `DEMO_USER_ID` mechanism and are fully
 * interactive when clicked through (stock drawers, embeds, sharing).
 *
 * Usage:
 *   npm run seed
 *   # or: npx tsx scripts/seed-landing-shelves.ts
 *
 * Reads DATABASE_URL from the environment (loaded from .env.local via dotenv).
 * The script is idempotent: it clears the admin account's existing shelves and
 * recreates them, then prints the admin user id to set as DEMO_USER_ID.
 *
 * See docs/guides/ADMIN_DEMO_SETUP.md.
 */

import 'dotenv/config';
import { sql } from '@/lib/db/client';
import { hashPassword } from '@/lib/utils/password';
import {
  getUserByEmail,
  createUser,
  createShelf,
  updateShelf,
  createItem,
} from '@/lib/db/queries';
import type { CreateItemData } from '@/lib/types/shelf';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@virtualbookshelf.app';
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'virtualbookshelf';
// Local/demo credential only — set SEED_ADMIN_PASSWORD for anything reachable.
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'demo-admin-please-change';

interface CuratedShelf {
  name: string;
  description: string;
  items: CreateItemData[];
}

// Proven cover-art patterns already used elsewhere in this codebase:
//   books   -> books.google.com/books/content?id=<volumeId>
//   podcast -> i.scdn.co/image/<id>   (Spotify)
//   music   -> i.scdn.co/image/<id>   (Spotify)
//   video   -> i.ytimg.com/vi/<id>/hqdefault.jpg   (YouTube)
//   stock   -> derived from the ticker at render time (no image_url needed)
// All image URLs below were HEAD-checked (200 + image/*) when this seed was
// written. Google Books covers fall back to Open Library by ISBN where Google
// returns a "no cover" placeholder.
const gbook = (id: string) =>
  `https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`;
const olCover = (isbn: string) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
const scdn = (hash: string) => `https://i.scdn.co/image/${hash}`;
const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const ytWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;

const SHELVES: CuratedShelf[] = [
  {
    name: 'Stocks to Watch',
    description: 'Tickers I follow — tap any one for a live price, 1-year chart, and headlines.',
    items: [
      { type: 'stock', title: 'Apple', creator: 'AAPL' },
      { type: 'stock', title: 'NVIDIA', creator: 'NVDA' },
      { type: 'stock', title: 'Microsoft', creator: 'MSFT' },
      { type: 'stock', title: 'Amazon', creator: 'AMZN' },
      { type: 'stock', title: 'Alphabet', creator: 'GOOGL' },
      { type: 'stock', title: 'Tesla', creator: 'TSLA' },
      { type: 'stock', title: 'Berkshire Hathaway', creator: 'BRK-B' },
      { type: 'stock', title: 'Costco', creator: 'COST' },
    ],
  },
  {
    name: 'Essential Reads',
    description: 'Books worth your time, with a few notes on why.',
    items: [
      {
        type: 'book',
        title: 'Atomic Habits',
        creator: 'James Clear',
        image_url: gbook('XfFvDwAAQBAJ'),
        external_url: 'https://www.google.com/books/edition/Atomic_Habits/XfFvDwAAQBAJ',
        notes: 'The 1% better every day framing finally made habits click for me.',
        rating: 5,
      },
      {
        type: 'book',
        title: 'Deep Work',
        creator: 'Cal Newport',
        image_url: gbook('4QTzCAAAQBAJ'),
        external_url: 'https://www.google.com/books/edition/Deep_Work/4QTzCAAAQBAJ',
        notes: 'Made me protect long, uninterrupted focus blocks.',
        rating: 5,
      },
      {
        type: 'book',
        title: 'The Psychology of Money',
        creator: 'Morgan Housel',
        image_url: gbook('TnrrDwAAQBAJ'),
        external_url: 'https://www.google.com/books/edition/The_Psychology_of_Money/TnrrDwAAQBAJ',
        rating: 4,
      },
      {
        type: 'book',
        title: 'Thinking, Fast and Slow',
        creator: 'Daniel Kahneman',
        image_url: gbook('ZuKTvERuPG8C'),
        external_url: 'https://www.google.com/books/edition/Thinking_Fast_and_Slow/ZuKTvERuPG8C',
      },
      {
        type: 'book',
        title: 'Sapiens',
        creator: 'Yuval Noah Harari',
        image_url: gbook('FmyBAwAAQBAJ'),
        external_url: 'https://www.google.com/books/edition/Sapiens/FmyBAwAAQBAJ',
      },
      {
        type: 'book',
        title: 'Shoe Dog',
        creator: 'Phil Knight',
        image_url: olCover('9781501135910'),
        external_url: 'https://openlibrary.org/isbn/9781501135910',
        notes: 'The most honest founder memoir I have read.',
        rating: 4,
      },
    ],
  },
  {
    name: "A Founder's Bookshelf",
    description: "What's shaping how I build — reading, listening, and watching.",
    items: [
      {
        type: 'book',
        title: 'Zero to One',
        creator: 'Peter Thiel',
        image_url: olCover('9780804139298'),
        external_url: 'https://openlibrary.org/isbn/9780804139298',
        rating: 5,
      },
      {
        type: 'book',
        title: 'The Hard Thing About Hard Things',
        creator: 'Ben Horowitz',
        image_url: olCover('9780062273208'),
        external_url: 'https://openlibrary.org/isbn/9780062273208',
      },
      {
        type: 'podcast',
        title: 'The Tim Ferriss Show',
        creator: 'Tim Ferriss',
        image_url: scdn('ab67656300005f1faebf288621ea86c79d44f12f'),
        external_url: 'https://open.spotify.com/show/5qSUyCrk9KR69lEiXbjwXM',
      },
      {
        type: 'podcast',
        title: 'Lex Fridman Podcast',
        creator: 'Lex Fridman',
        image_url: scdn('ab6772ab000015be114d0745f4adc5b52463db41'),
        external_url: 'https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL',
      },
      { type: 'stock', title: 'Berkshire Hathaway', creator: 'BRK-B' },
      { type: 'stock', title: 'NVIDIA', creator: 'NVDA' },
      {
        type: 'link',
        title: 'How to Start a Startup',
        creator: 'ycombinator.com',
        image_url:
          'https://www.ycombinator.com/assets/ycdc/yc-og-image-c440a0ad1dacfb86eeeb343717479cc54d256614449b4ef719977a0a451f8bc8.png',
        external_url: 'https://www.ycombinator.com/library',
      },
    ],
  },
  {
    name: 'Sunday Listening',
    description: 'A slow-morning rotation of shows, one great episode, and a couple of albums.',
    items: [
      {
        type: 'podcast',
        title: 'Huberman Lab',
        creator: 'Andrew Huberman',
        image_url:
          'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/9a/d3/19/9ad31912-0b5a-a16e-2d7c-9fd074698b9c/mza_8994222203629500925.jpg/600x600bb.jpg',
        external_url: 'https://open.spotify.com/show/79CkJF3UJTHFV8Dse3Ez0S',
      },
      {
        type: 'podcast_episode',
        title: 'Master Your Sleep & Be More Alert When Awake',
        creator: 'Huberman Lab',
        image_url:
          'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/9a/d3/19/9ad31912-0b5a-a16e-2d7c-9fd074698b9c/mza_8994222203629500925.jpg/600x600bb.jpg',
        external_url: 'https://open.spotify.com/show/79CkJF3UJTHFV8Dse3Ez0S',
        notes: 'A great primer on circadian rhythm and light exposure.',
      },
      {
        type: 'music',
        title: 'Random Access Memories',
        creator: 'Daft Punk',
        image_url: scdn('ab67616d00001e029b9b36b0e22870b9f542d937'),
        external_url: 'https://open.spotify.com/album/4m2880jivSbbyEGAKfITCa',
      },
      {
        type: 'music',
        title: 'Kind of Blue',
        creator: 'Miles Davis',
        image_url: scdn('ab67616d00001e02387a29c90de3b2398c29c34f'),
        external_url: 'https://open.spotify.com/album/1weenld61qoidwYuZ1GESA',
        rating: 5,
      },
    ],
  },
  {
    name: 'Worth Watching',
    description: 'Talks and reads I keep coming back to.',
    items: [
      {
        type: 'video',
        title: "Steve Jobs' 2005 Stanford Commencement Address",
        creator: 'Stanford',
        image_url: ytThumb('UF8uR6Z6KLc'),
        external_url: ytWatch('UF8uR6Z6KLc'),
        rating: 5,
      },
      {
        type: 'video',
        title: 'How great leaders inspire action',
        creator: 'TED',
        image_url: ytThumb('qp0HIF3SfI4'),
        external_url: ytWatch('qp0HIF3SfI4'),
      },
      {
        type: 'video',
        title: 'Inside the mind of a master procrastinator',
        creator: 'TED',
        image_url: ytThumb('arj7oStGLkU'),
        external_url: ytWatch('arj7oStGLkU'),
      },
      {
        type: 'link',
        title: 'Steve Jobs',
        creator: 'en.wikipedia.org',
        image_url:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Steve_Jobs_Headshot_2010_%28cropped_4%29.jpg/960px-Steve_Jobs_Headshot_2010_%28cropped_4%29.jpg',
        external_url: 'https://en.wikipedia.org/wiki/Steve_Jobs',
      },
    ],
  },
];

async function seed() {
  console.log('🌱 Seeding landing-page demo shelves...\n');

  // 1. Upsert the admin user.
  let user = await getUserByEmail(ADMIN_EMAIL);
  if (user) {
    console.log(`👤 Using existing admin: ${ADMIN_EMAIL}`);
    // Clear prior demo content so re-runs are clean (items cascade with shelves).
    await sql`DELETE FROM shelves WHERE user_id = ${user.id}`;
    console.log('🗑️  Cleared existing shelves');
  } else {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    user = await createUser({ username: ADMIN_USERNAME, email: ADMIN_EMAIL, passwordHash });
    console.log(`👤 Created admin: ${ADMIN_EMAIL}`);
  }

  // 2. Create each curated shelf (public) with its items.
  let totalItems = 0;
  for (const curated of SHELVES) {
    const shelf = await createShelf(user.id, curated.name, curated.description);
    await updateShelf(shelf.id, { is_public: true });

    for (let i = 0; i < curated.items.length; i++) {
      await createItem(shelf.id, { ...curated.items[i], order_index: i }, user.id);
    }
    totalItems += curated.items.length;
    console.log(`📚 ${curated.name} — ${curated.items.length} items`);
  }

  console.log(`\n✅ Seeded ${SHELVES.length} shelves / ${totalItems} items`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Set this in your environment (.env.local / hosting provider):\n');
  console.log(`DEMO_USER_ID=${user.id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
