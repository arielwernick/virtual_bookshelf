/**
 * URL helpers for pasted links whose page metadata needs help: Spotify show
 * pages and Google Books volumes.
 */

/** Spotify show id from an open.spotify.com/show/<id> link, or null */
export function getSpotifyShowId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'open.spotify.com') return null;
    const match = parsed.pathname.match(/^\/(?:intl-[a-z-]+\/)?show\/([A-Za-z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Google Books pages give Microlink no image, but every volume has a cover at
 * a predictable address built from its id.
 */
export function getGoogleBooksCoverUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!/^books\.google\.[a-z.]+$/.test(parsed.hostname)) return null;
    const id = parsed.searchParams.get('id');
    if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) return null;
    return `https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=1`;
  } catch {
    return null;
  }
}
