/**
 * Static content for the landing page capability showcase.
 *
 * This data is intentionally decoupled from the database: the marketing
 * sections must render perfectly even when no demo content is configured
 * (`DEMO_USER_ID` unset). The live, click-through examples come from the
 * seeded admin shelves instead — see `app/page.tsx` and the rotating gallery.
 *
 * Icons are rendered from the string keys below by the showcase components,
 * keeping this module free of JSX so it stays a plain data file.
 */

import { ItemType } from '@/lib/types/shelf';

/** One tile per media type a shelf can hold ("Shelve anything" row). */
export interface CapabilityTile {
  type: ItemType;
  /** Short plural label, e.g. "Books". */
  label: string;
  /** One line describing the capability and how the data is gathered. */
  tagline: string;
  /** Tailwind classes for the icon chip — mirrors the per-type badge palette. */
  accent: string;
  /** Highlights the live/interactive stock capability with a "Live" pill. */
  live?: boolean;
}

export const CAPABILITY_TILES: CapabilityTile[] = [
  {
    type: 'book',
    label: 'Books',
    tagline: 'Search millions of titles and drop in the cover in one click.',
    accent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  {
    type: 'podcast',
    label: 'Podcasts',
    tagline: 'Add any show straight from Spotify, artwork and all.',
    accent: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  },
  {
    type: 'podcast_episode',
    label: 'Episodes',
    tagline: 'Pin a single must-hear episode, not just the whole show.',
    accent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  {
    type: 'music',
    label: 'Music',
    tagline: 'Albums and tracks with real cover art, ready to share.',
    accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  {
    type: 'video',
    label: 'Videos',
    tagline: 'Paste a YouTube link — title and thumbnail auto-fill.',
    accent: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  },
  {
    type: 'link',
    label: 'Links',
    tagline: 'Save any URL; we pull the title, image, and source for you.',
    accent: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  },
  {
    type: 'stock',
    label: 'Stocks',
    tagline: 'Track a ticker with a live price, 1-year chart, and headlines.',
    accent: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    live: true,
  },
];

/** "Search · Click · Added" — the three-step ease-of-use strip. */
export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    step: 1,
    title: 'Search or paste',
    description: 'Find a book, show, album, or video — or paste any link or ticker.',
  },
  {
    step: 2,
    title: 'Click to add',
    description: 'Cover art and details fill in automatically. No copy-paste.',
  },
  {
    step: 3,
    title: 'Share anywhere',
    description: 'Send the link, embed it, or drop it in your bio. Done.',
  },
];
