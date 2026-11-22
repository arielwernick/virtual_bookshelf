import { describe, it, expect } from 'vitest';
import { getGoogleBooksCoverUrl, getSpotifyShowId } from './importLinks';

describe('getSpotifyShowId', () => {
  it('reads the id from a show link', () => {
    expect(getSpotifyShowId('https://open.spotify.com/show/7Fj0XEuUQLUqoMZQdsLXqp?si=abc')).toBe(
      '7Fj0XEuUQLUqoMZQdsLXqp'
    );
  });

  it('reads the id from a localized show link', () => {
    expect(getSpotifyShowId('https://open.spotify.com/intl-de/show/7Fj0XEuUQLUqoMZQdsLXqp')).toBe(
      '7Fj0XEuUQLUqoMZQdsLXqp'
    );
  });

  it('ignores albums, episodes and other sites', () => {
    expect(getSpotifyShowId('https://open.spotify.com/album/1weenld61qoidwYuZ1GESA')).toBeNull();
    expect(getSpotifyShowId('https://open.spotify.com/episode/1hcUG3VEBIRKxOFyJn36xr')).toBeNull();
    expect(getSpotifyShowId('https://example.com/show/abc')).toBeNull();
    expect(getSpotifyShowId('not a url')).toBeNull();
  });
});

describe('getGoogleBooksCoverUrl', () => {
  it('builds the cover address from the volume id', () => {
    expect(getGoogleBooksCoverUrl('https://books.google.com/books?id=wrOQLV6xB-wC')).toBe(
      'https://books.google.com/books/content?id=wrOQLV6xB-wC&printsec=frontcover&img=1&zoom=1'
    );
  });

  it('handles regional Google Books domains', () => {
    expect(getGoogleBooksCoverUrl('https://books.google.co.uk/books?id=wrOQLV6xB-wC&hl=en')).toContain(
      'id=wrOQLV6xB-wC'
    );
  });

  it('ignores links without a volume id or from other sites', () => {
    expect(getGoogleBooksCoverUrl('https://books.google.com/books')).toBeNull();
    expect(getGoogleBooksCoverUrl('https://example.com/books?id=wrOQLV6xB-wC')).toBeNull();
    expect(getGoogleBooksCoverUrl('https://books.google.com/books?id=bad"id')).toBeNull();
  });
});
