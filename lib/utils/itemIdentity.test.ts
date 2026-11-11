import { describe, it, expect } from 'vitest';
import { canonicalUrlForIdentity, deriveItemIdentity } from './itemIdentity';

describe('deriveItemIdentity', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ'],
  ])('reads the YouTube id from %s', (url) => {
    expect(deriveItemIdentity('video', url)).toEqual({ source: 'youtube', sourceId: 'dQw4w9WgXcQ' });
  });

  it.each([
    ['music', 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy', 'album:4aawyAB9vmqN3uQ7FjRGTy'],
    ['music', 'https://open.spotify.com/track/4aawyAB9vmqN3uQ7FjRGTy?si=x', 'track:4aawyAB9vmqN3uQ7FjRGTy'],
    ['podcast', 'https://open.spotify.com/show/4aawyAB9vmqN3uQ7FjRGTy', 'show:4aawyAB9vmqN3uQ7FjRGTy'],
    ['podcast_episode', 'https://open.spotify.com/intl-de/episode/4aawyAB9vmqN3uQ7FjRGTy', 'episode:4aawyAB9vmqN3uQ7FjRGTy'],
  ] as const)('reads the Spotify id for %s from %s', (type, url, sourceId) => {
    expect(deriveItemIdentity(type, url)).toEqual({ source: 'spotify', sourceId });
  });

  it.each([
    ['http://books.google.com/books?id=zyTCAlFPjgYC&dq=x&hl=&source=gbs_api'],
    ['https://books.google.co.uk/books?id=zyTCAlFPjgYC'],
    ['https://www.google.com/books/edition/The_Google_Story/zyTCAlFPjgYC?hl=en'],
  ])('reads the Google Books volume id from %s', (url) => {
    expect(deriveItemIdentity('book', url)).toEqual({ source: 'google_books', sourceId: 'zyTCAlFPjgYC' });
  });

  it('reads Open Library, Goodreads, Amazon and Apple Podcasts ids', () => {
    expect(deriveItemIdentity('book', 'https://openlibrary.org/works/OL45804W/Fantastic_Mr_Fox')).toEqual({
      source: 'open_library',
      sourceId: 'OL45804W',
    });
    expect(deriveItemIdentity('book', 'https://www.goodreads.com/book/show/5907.The_Hobbit')).toEqual({
      source: 'goodreads',
      sourceId: '5907',
    });
    expect(deriveItemIdentity('book', 'https://www.amazon.com/Deep-Work/dp/1455586692/ref=sr_1_1')).toEqual({
      source: 'amazon',
      sourceId: '1455586692',
    });
    expect(
      deriveItemIdentity('podcast_episode', 'https://podcasts.apple.com/us/podcast/a-show/id1200361736?i=1000654321')
    ).toEqual({ source: 'apple_podcasts', sourceId: '1200361736:1000654321' });
  });

  it('uses the ticker for stocks', () => {
    expect(deriveItemIdentity('stock', 'https://finance.yahoo.com/quote/aapl', 'aapl')).toEqual({
      source: 'ticker',
      sourceId: 'AAPL',
    });
    expect(deriveItemIdentity('stock', null, '')).toBeNull();
  });

  it('returns null when there is no identifier to trust', () => {
    expect(deriveItemIdentity('link', 'https://example.com/some-post')).toBeNull();
    expect(deriveItemIdentity('book', null)).toBeNull();
    expect(deriveItemIdentity('book', 'not a url')).toBeNull();
    expect(deriveItemIdentity('video', 'javascript:alert(1)')).toBeNull();
  });

  it('is not fooled by look-alike hosts or ids in the wrong place', () => {
    expect(deriveItemIdentity('video', 'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(deriveItemIdentity('music', 'https://evil.example/open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy')).toBeNull();
    expect(deriveItemIdentity('link', 'https://example.com/?v=dQw4w9WgXcQ')).toBeNull();
    expect(deriveItemIdentity('video', 'https://www.youtube.com/watch?v=too-short')).toBeNull();
  });
});

describe('canonicalUrlForIdentity', () => {
  it('round-trips through deriveItemIdentity', () => {
    const cases = [
      ['video', 'https://youtu.be/dQw4w9WgXcQ'],
      ['music', 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy?si=1'],
      ['book', 'http://books.google.com/books?id=zyTCAlFPjgYC&dq=x'],
      ['book', 'https://openlibrary.org/works/OL45804W'],
      ['podcast', 'https://podcasts.apple.com/us/podcast/a-show/id1200361736'],
    ] as const;

    for (const [type, url] of cases) {
      const identity = deriveItemIdentity(type, url)!;
      const canonical = canonicalUrlForIdentity(identity.source, identity.sourceId)!;
      expect(deriveItemIdentity(type, canonical)).toEqual(identity);
    }
  });

  it('returns null for sources with no single public address', () => {
    expect(canonicalUrlForIdentity('ticker', 'AAPL')).toBeNull();
    expect(canonicalUrlForIdentity('amazon', '1455586692')).toBeNull();
    expect(canonicalUrlForIdentity(null, null)).toBeNull();
  });
});
