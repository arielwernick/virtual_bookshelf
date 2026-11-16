/**
 * Canonical identity for shelf items (issue #288).
 *
 * Derives "which catalogue, which id" from an item's URL so that the same
 * book, album, show or video can be recognised across shelves. This is what
 * `sameAs` in structured data, de-duplication and "also on N shelves" build on.
 *
 * Rules:
 * - Identifier matching only. Never guess from titles or creators: a wrong
 *   merge costs more trust than a missed one.
 * - Pure and synchronous: no network, safe to call on every write.
 * - A Google Books volume id is an edition, not a work. Grouping editions
 *   into works is a later step.
 */

import type { ItemType } from '@/lib/types/shelf';

export type ItemSource =
  | 'youtube'
  | 'spotify'
  | 'google_books'
  | 'open_library'
  | 'apple_podcasts'
  | 'goodreads'
  | 'amazon'
  | 'ticker';

export interface ItemIdentity {
  source: ItemSource;
  sourceId: string;
}

const MAX_SOURCE_ID_LENGTH = 255;

function hostMatches(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function clean(id: string | null | undefined, pattern: RegExp): string | null {
  if (!id) return null;
  const trimmed = id.trim();
  if (!trimmed || trimmed.length > MAX_SOURCE_ID_LENGTH) return null;
  return pattern.test(trimmed) ? trimmed : null;
}

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/);
      id = match ? match[1] : null;
    }
  }
  return clean(id, /^[A-Za-z0-9_-]{11}$/);
}

/** Spotify ids are stored as "<kind>:<id>", the tail of a Spotify URI. */
function spotifyId(url: URL): string | null {
  if (url.hostname !== 'open.spotify.com') return null;
  const match = url.pathname.match(
    /^\/(?:intl-[a-z-]+\/)?(album|track|show|episode|artist|playlist)\/([A-Za-z0-9]{22})/
  );
  return match ? `${match[1]}:${match[2]}` : null;
}

function googleBooksId(url: URL): string | null {
  const isBooksHost = /^books\.google\.[a-z.]+$/.test(url.hostname) || url.hostname === 'play.google.com';
  const isGoogleHost = /^(www\.)?google\.[a-z.]+$/.test(url.hostname);
  if (isBooksHost) {
    return clean(url.searchParams.get('id'), /^[A-Za-z0-9_-]{6,20}$/);
  }
  if (isGoogleHost) {
    // google.com/books/edition/<title>/<id>
    const match = url.pathname.match(/^\/books\/edition\/[^/]+\/([A-Za-z0-9_-]{6,20})/);
    return match ? match[1] : null;
  }
  return null;
}

function openLibraryId(url: URL): string | null {
  if (!hostMatches(url.hostname, 'openlibrary.org')) return null;
  const match = url.pathname.match(/^\/(?:works|books)\/(OL\d+[WM])/);
  return match ? match[1] : null;
}

/** "<show id>" for a show, "<show id>:<episode id>" for an episode. */
function applePodcastsId(url: URL): string | null {
  if (url.hostname !== 'podcasts.apple.com') return null;
  const match = url.pathname.match(/\/id(\d{5,15})(?:\/|$)/);
  if (!match) return null;
  const episode = clean(url.searchParams.get('i'), /^\d{5,15}$/);
  return episode ? `${match[1]}:${episode}` : match[1];
}

function goodreadsId(url: URL): string | null {
  if (!hostMatches(url.hostname, 'goodreads.com')) return null;
  const match = url.pathname.match(/^\/book\/show\/(\d+)/);
  return match ? match[1] : null;
}

function amazonAsin(url: URL): string | null {
  if (!/(^|\.)amazon\.[a-z.]+$/.test(url.hostname)) return null;
  const match = url.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/);
  return match ? match[1] : null;
}

const URL_RESOLVERS: Array<[ItemSource, (url: URL) => string | null]> = [
  ['youtube', youtubeId],
  ['spotify', spotifyId],
  ['google_books', googleBooksId],
  ['open_library', openLibraryId],
  ['apple_podcasts', applePodcastsId],
  ['goodreads', goodreadsId],
  ['amazon', amazonAsin],
];

/**
 * Work out an item's canonical identity, or null when its URL carries none.
 *
 * For stocks the identity is the ticker, which the app stores in `creator`.
 */
export function deriveItemIdentity(
  type: ItemType,
  externalUrl: string | null | undefined,
  creator?: string | null
): ItemIdentity | null {
  if (type === 'stock') {
    const ticker = clean(creator?.toUpperCase(), /^[A-Z0-9.\-^=]{1,15}$/);
    return ticker ? { source: 'ticker', sourceId: ticker } : null;
  }

  if (!externalUrl) return null;

  let url: URL;
  try {
    url = new URL(externalUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  for (const [source, resolve] of URL_RESOLVERS) {
    const sourceId = resolve(url);
    if (sourceId) return { source, sourceId };
  }
  return null;
}

/**
 * The clean, canonical URL for an identity, for `sameAs` in structured data.
 * Returns null for sources with no single public address (tickers, ASINs).
 */
export function canonicalUrlForIdentity(
  source: string | null | undefined,
  sourceId: string | null | undefined
): string | null {
  if (!source || !sourceId) return null;

  switch (source) {
    case 'youtube':
      return `https://www.youtube.com/watch?v=${sourceId}`;
    case 'spotify': {
      const [kind, id] = sourceId.split(':');
      return kind && id ? `https://open.spotify.com/${kind}/${id}` : null;
    }
    case 'google_books':
      return `https://books.google.com/books?id=${sourceId}`;
    case 'open_library':
      return `https://openlibrary.org/${sourceId.endsWith('W') ? 'works' : 'books'}/${sourceId}`;
    case 'apple_podcasts': {
      const [show, episode] = sourceId.split(':');
      const base = `https://podcasts.apple.com/podcast/id${show}`;
      return episode ? `${base}?i=${episode}` : base;
    }
    case 'goodreads':
      return `https://www.goodreads.com/book/show/${sourceId}`;
    default:
      return null;
  }
}
