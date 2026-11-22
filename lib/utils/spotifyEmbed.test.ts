import { describe, it, expect } from 'vitest';
import { getSpotifyEmbed } from './spotifyEmbed';
import { Item } from '@/lib/types/shelf';

const ID = '4uLU6hMCjMI75M1A2tKUQC';
const embed = (type: Item['type'], external_url: string | null) => getSpotifyEmbed({ type, external_url });

describe('getSpotifyEmbed', () => {
  it('uses the compact player for tracks and episodes', () => {
    expect(embed('music', `https://open.spotify.com/track/${ID}`)).toEqual({
      src: `https://open.spotify.com/embed/track/${ID}?utm_source=generator`,
      height: 152,
    });
    expect(embed('podcast_episode', `https://open.spotify.com/episode/${ID}`)?.height).toBe(152);
  });

  it('uses the tall player for albums, shows, playlists and artists', () => {
    for (const kind of ['album', 'show', 'playlist', 'artist']) {
      const result = embed('music', `https://open.spotify.com/${kind}/${ID}`);
      expect(result?.src).toBe(`https://open.spotify.com/embed/${kind}/${ID}?utm_source=generator`);
      expect(result?.height).toBe(352);
    }
  });

  it('handles localized URLs and query strings', () => {
    expect(embed('podcast', `https://open.spotify.com/intl-de/show/${ID}?si=abc`)?.src).toBe(
      `https://open.spotify.com/embed/show/${ID}?utm_source=generator`
    );
  });

  it('returns null for non-Spotify or missing URLs', () => {
    expect(embed('music', null)).toBeNull();
    expect(embed('book', 'https://books.google.com/books?id=abc123')).toBeNull();
    expect(embed('video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(embed('link', 'https://spotify.com/us/premium/')).toBeNull();
  });

  it('returns null for stocks', () => {
    expect(embed('stock', `https://open.spotify.com/track/${ID}`)).toBeNull();
  });
});
