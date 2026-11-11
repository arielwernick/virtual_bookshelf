/**
 * Fixed results returned by the outside-API clients in mock mode
 * (lib/api/mockMode.ts). Real, recognisable works with stable public URLs,
 * so pages built from them look right and identifiers can be derived.
 *
 * Results do not depend on the query, except that a query containing
 * "nothing" returns no results, so empty states can be tested too.
 */

import type { BookItem } from './googleBooks';
import type { Episode, SpotifyItem } from './spotify';
import type { YouTubeVideo } from './youtube';
import type { MicrolinkData } from './microlink';

export const wantsNoResults = (query: string) => query.toLowerCase().includes('nothing');

export const MOCK_BOOKS: BookItem[] = [
  {
    id: 'zyTCAlFPjgYC',
    title: 'The Google Story',
    creator: 'David A. Vise, Mark Malseed',
    imageUrl: '',
    externalUrl: 'https://books.google.com/books?id=zyTCAlFPjgYC',
    type: 'book',
  },
  {
    id: 'wrOQLV6xB-wC',
    title: 'Pride and Prejudice',
    creator: 'Jane Austen',
    imageUrl: '',
    externalUrl: 'https://books.google.com/books?id=wrOQLV6xB-wC',
    type: 'book',
  },
];

export const MOCK_ALBUMS: SpotifyItem[] = [
  {
    id: '5vkqYmiPBYLaalcmjujWxK',
    title: 'In Rainbows',
    creator: 'Radiohead',
    imageUrl: '',
    externalUrl: 'https://open.spotify.com/album/5vkqYmiPBYLaalcmjujWxK',
    type: 'music',
  },
  {
    id: '4LH4d3cOWNNsVw41Gqt2kv',
    title: 'The Dark Side of the Moon',
    creator: 'Pink Floyd',
    imageUrl: '',
    externalUrl: 'https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv',
    type: 'music',
  },
];

export const MOCK_PODCASTS: SpotifyItem[] = [
  {
    id: '7Fj0XEuUQLUqoMZQdsLXqp',
    title: 'Acquired',
    creator: 'Ben Gilbert and David Rosenthal',
    imageUrl: '',
    externalUrl: 'https://open.spotify.com/show/7Fj0XEuUQLUqoMZQdsLXqp',
    type: 'podcast',
  },
  {
    id: '2MAi0BvDc6GTFvKFPXnkCL',
    title: 'Lex Fridman Podcast',
    creator: 'Lex Fridman',
    imageUrl: '',
    externalUrl: 'https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL',
    type: 'podcast',
  },
];

export const MOCK_EPISODES: Episode[] = [
  {
    id: '1a2b3c4d5e6f7g8h9i0jkl',
    title: 'Mock episode one',
    description: 'The first fixed episode returned in mock mode.',
    duration_ms: 3_600_000,
    release_date: '2026-01-15',
    imageUrl: '',
    externalUrl: 'https://open.spotify.com/episode/1a2b3c4d5e6f7g8h9i0jkl',
    showName: 'Acquired',
  },
  {
    id: '0z9y8x7w6v5u4t3s2r1qpo',
    title: 'Mock episode two',
    description: 'The second fixed episode returned in mock mode.',
    duration_ms: 1_800_000,
    release_date: '2026-02-01',
    imageUrl: '',
    externalUrl: 'https://open.spotify.com/episode/0z9y8x7w6v5u4t3s2r1qpo',
    showName: 'Acquired',
  },
];

/** The video is whichever id was asked for, so /v/<id> pages still line up. */
export function mockVideo(videoId: string): YouTubeVideo {
  return {
    id: videoId,
    title: `Mock video ${videoId}`,
    channelName: 'Mock Channel',
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

/** Link metadata built from the URL itself, with no request made. */
export function mockLinkMetadata(url: string): MicrolinkData {
  const { hostname, pathname } = new URL(url);
  const host = hostname.replace(/^www\./, '');
  return {
    title: `Mock page at ${host}${pathname === '/' ? '' : pathname}`,
    image: null,
    publisher: host,
    description: 'Fixed link metadata returned in mock mode.',
    url,
  };
}
