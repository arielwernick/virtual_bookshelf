import { fetchPublicUrl } from '@/lib/utils/safeFetch';

export const IMAGE_FETCH_TIMEOUT_MS = 2500;
/** Largest cover image that will be loaded into a share card. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const OG_CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

/**
 * Fetch an external image and return it as a base64 data URL.
 *
 * Used by edge OG routes to prefetch covers before handing them to Satori.
 * Satori has no built-in timeout and will abort the whole render if a single
 * image hangs — fetching here lets a slow/broken cover fail in isolation so
 * the route can fall back to a placeholder for that one tile.
 */
export async function fetchAsDataUrl(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
  try {
    // Cover URLs come from shelf owners. Only public addresses are fetched,
    // and each redirect hop is checked the same way (lib/utils/safeFetch.ts).
    const { response: res } = await fetchPublicUrl(url, {
      signal: controller.signal,
      headers: { Accept: 'image/*' },
    });
    if (!res.ok) return null;
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
