export const IMAGE_FETCH_TIMEOUT_MS = 2500;
/** Largest cover image that will be loaded into a share card. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const OG_CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

/** Redirects followed for one cover. Each hop must also be a known image host. */
const MAX_IMAGE_REDIRECTS = 2;

/**
 * The URL to request for a cover image, rebuilt on a fixed address for each
 * image host the app's own integrations use. Returns null for any other host.
 *
 * Cover URLs are stored on items by their owners, so the server only ever
 * requests one of the hosts written below; only the path and query come from
 * the stored URL. Covers from other sites (for example a link's preview
 * image) go through the site's image optimizer instead (optimizedCoverUrl).
 */
export function coverRequestUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const rest = `${parsed.pathname.replace(/^\/+/, '')}${parsed.search}`;
  switch (parsed.hostname.toLowerCase()) {
    // Google Books covers
    case 'books.google.com':
      return `https://books.google.com/${rest}`;
    case 'books.googleusercontent.com':
      return `https://books.googleusercontent.com/${rest}`;
    // Spotify album, show and episode art
    case 'i.scdn.co':
      return `https://i.scdn.co/${rest}`;
    case 'mosaic.scdn.co':
      return `https://mosaic.scdn.co/${rest}`;
    case 'image-cdn-ak.spotifycdn.com':
      return `https://image-cdn-ak.spotifycdn.com/${rest}`;
    case 'image-cdn-fa.spotifycdn.com':
      return `https://image-cdn-fa.spotifycdn.com/${rest}`;
    // YouTube thumbnails
    case 'i.ytimg.com':
      return `https://i.ytimg.com/${rest}`;
    case 'img.youtube.com':
      return `https://img.youtube.com/${rest}`;
    // Apple Podcasts artwork
    case 'is1-ssl.mzstatic.com':
      return `https://is1-ssl.mzstatic.com/${rest}`;
    case 'is2-ssl.mzstatic.com':
      return `https://is2-ssl.mzstatic.com/${rest}`;
    case 'is3-ssl.mzstatic.com':
      return `https://is3-ssl.mzstatic.com/${rest}`;
    case 'is4-ssl.mzstatic.com':
      return `https://is4-ssl.mzstatic.com/${rest}`;
    case 'is5-ssl.mzstatic.com':
      return `https://is5-ssl.mzstatic.com/${rest}`;
    // Stock logos (app/api/finance/quote)
    case 'financialmodelingprep.com':
      return `https://financialmodelingprep.com/${rest}`;
    case 't1.gstatic.com':
      return `https://t1.gstatic.com/${rest}`;
    default:
      return null;
  }
}

/**
 * This site's own address, for requests the server makes to itself. Taken
 * from configuration, never from the incoming request.
 *
 * Production uses the public domain. A preview uses its deployment address;
 * previews behind Vercel's login wall answer 401 to this, so their share
 * cards show placeholders for covers from other sites. Production does not
 * have that problem.
 */
function ownOrigin(): string {
  if (process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return (process.env.NEXT_PUBLIC_BASE_URL || 'https://virtualbookshelf.app').replace(/\/+$/, '');
}

/**
 * The request for a cover on any other site: this site's own image optimizer
 * (`/_next/image`), which fetches it. The optimizer resolves the host, refuses
 * private and internal addresses, and pins the address it checked
 * (`images.dangerouslyAllowLocalIP` is false by default in Next.js 16). So the
 * server itself still only ever calls its own address.
 *
 * Width and quality must be values next.config allows (defaults: 256, 75).
 * Only https covers qualify, as next.config's remotePatterns require.
 */
export function optimizedCoverUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  return `${ownOrigin()}/_next/image?url=${encodeURIComponent(parsed.href)}&w=256&q=75`;
}

/**
 * Fetch a cover image and return it as a base64 data URL.
 *
 * Used by edge OG routes to prefetch covers before handing them to Satori.
 * Satori has no built-in timeout and will abort the whole render if a single
 * image hangs — fetching here lets a slow/broken cover fail in isolation so
 * the route can fall back to a placeholder for that one tile.
 *
 * Covers on the known image hosts are requested directly (coverRequestUrl),
 * following a redirect only to another known host. Every other cover goes
 * through this site's own image optimizer (optimizedCoverUrl). The server never
 * requests an address a user chose.
 */
export async function fetchAsDataUrl(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
  try {
    const direct = coverRequestUrl(url);
    let target = direct ?? optimizedCoverUrl(url);
    let res: Response | null = null;

    for (let hop = 0; target && hop <= MAX_IMAGE_REDIRECTS; hop++) {
      res = await fetch(target, {
        signal: controller.signal,
        // PNG or JPEG only: the share-card renderer cannot draw WebP or AVIF,
        // and the optimizer picks its output format from this header
        headers: { Accept: 'image/png,image/jpeg,image/gif' },
        redirect: 'manual',
      });
      const location =
        res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
      if (!location) break;
      // The optimizer answers directly; only a known host's redirect is followed
      target = direct ? coverRequestUrl(new URL(location, target).href) : null;
      res = null;
    }

    if (!res || !res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    // A share card needs a thumbnail, not a 50 MB file held in memory.
    const declaredSize = Number(res.headers.get('content-length') ?? 0);
    if (declaredSize > MAX_IMAGE_BYTES) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) return null;

    return `data:${contentType};base64,${uint8ToBase64(new Uint8Array(buffer))}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}
