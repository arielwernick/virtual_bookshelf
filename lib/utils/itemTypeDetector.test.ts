import { describe, it, expect } from 'vitest';
import { detectItemType, detectItemTypes } from './itemTypeDetector';

// ============================================================================
// detectItemType Tests
// ============================================================================

describe('detectItemType', () => {
  describe('podcast detection', () => {
    it('detects Spotify show as podcast', () => {
      expect(detectItemType('https://open.spotify.com/show/abc123')).toBe('podcast');
    });

    it('detects Spotify episode as podcast', () => {
      expect(detectItemType('https://open.spotify.com/episode/xyz789')).toBe('podcast');
    });

    it('detects Apple Podcasts as podcast', () => {
      expect(detectItemType('https://podcasts.apple.com/us/podcast/some-show/id123')).toBe('podcast');
    });

    it('detects Pocket Casts as podcast', () => {
      expect(detectItemType('https://pocketcasts.com/podcast/abc')).toBe('podcast');
    });

    it('detects Overcast as podcast', () => {
      expect(detectItemType('https://overcast.fm/+abc123')).toBe('podcast');
    });
  });

  describe('music detection', () => {
    it('detects Spotify track as music', () => {
      expect(detectItemType('https://open.spotify.com/track/abc123')).toBe('music');
    });

    it('detects Spotify album as music', () => {
      expect(detectItemType('https://open.spotify.com/album/xyz789')).toBe('music');
    });

    it('detects Spotify playlist as music', () => {
      expect(detectItemType('https://open.spotify.com/playlist/def456')).toBe('music');
    });

    it('detects Apple Music as music', () => {
      expect(detectItemType('https://music.apple.com/us/album/some-album/123')).toBe('music');
    });

    it('detects SoundCloud as music', () => {
      expect(detectItemType('https://soundcloud.com/artist/track')).toBe('music');
    });

    it('detects Bandcamp as music', () => {
      expect(detectItemType('https://artist.bandcamp.com/album/some-album')).toBe('music');
    });
  });

  describe('book detection', () => {
    it('detects Goodreads as book', () => {
      expect(detectItemType('https://www.goodreads.com/book/show/123')).toBe('book');
    });

    it('detects Amazon product as book', () => {
      expect(detectItemType('https://www.amazon.com/dp/B08XY12345')).toBe('book');
    });

    it('detects Amazon book URL as book', () => {
      expect(detectItemType('https://www.amazon.com/Some-Book/dp/0123456789')).toBe('book');
    });

    it('detects Bookshop.org as book', () => {
      expect(detectItemType('https://bookshop.org/book/some-book-123')).toBe('book');
    });

    it('detects Audible as book', () => {
      expect(detectItemType('https://www.audible.com/pd/Some-Audiobook/B08XYZ')).toBe('book');
    });
  });

  describe('video detection', () => {
    it('detects YouTube as video', () => {
      expect(detectItemType('https://www.youtube.com/watch?v=abc123')).toBe('video');
    });

    it('detects youtu.be as video', () => {
      expect(detectItemType('https://youtu.be/abc123')).toBe('video');
    });

    it('detects Vimeo as video', () => {
      expect(detectItemType('https://vimeo.com/123456')).toBe('video');
    });
  });

  describe('link detection (default)', () => {
    it('detects generic URLs as link', () => {
      expect(detectItemType('https://example.com/some-article')).toBe('link');
    });

    it('detects blog posts as link', () => {
      expect(detectItemType('https://medium.com/@user/article-title-123')).toBe('link');
    });

    it('detects news sites as link', () => {
      expect(detectItemType('https://techcrunch.com/2024/01/article')).toBe('link');
    });
  });

  describe('edge cases', () => {
    it('handles invalid URLs gracefully', () => {
      expect(detectItemType('not-a-url')).toBe('link');
    });

    it('handles empty string gracefully', () => {
      expect(detectItemType('')).toBe('link');
    });

    it('handles URLs with www prefix', () => {
      expect(detectItemType('https://www.goodreads.com/book/show/123')).toBe('book');
    });

    it('handles URLs with query params', () => {
      expect(detectItemType('https://open.spotify.com/track/abc123?si=xyz')).toBe('music');
    });

    it('handles Spotify root URL as link (no specific content)', () => {
      // Root Spotify URL without specific path should be link
      expect(detectItemType('https://open.spotify.com/')).toBe('link');
    });
  });
});

// ============================================================================
// detectItemTypes Tests
// ============================================================================

describe('detectItemTypes', () => {
  it('detects types for multiple URLs', () => {
    const urls = [
      'https://open.spotify.com/track/abc',
      'https://www.goodreads.com/book/show/123',
      'https://example.com/article',
    ];

    const result = detectItemTypes(urls);

    expect(result['https://open.spotify.com/track/abc']).toBe('music');
    expect(result['https://www.goodreads.com/book/show/123']).toBe('book');
    expect(result['https://example.com/article']).toBe('link');
  });

  it('handles empty array', () => {
    const result = detectItemTypes([]);
    expect(result).toEqual({});
  });
});
