/**
 * URL Resolver Utility
 * 
 * Resolves shortened URLs (lnkd.in, bit.ly, t.co, etc.) to their
 * final destination URLs by following redirects.
 */

/**
 * Known URL shortener domains
 */
const SHORTENER_DOMAINS = [
  'lnkd.in',
  'bit.ly',
  't.co',
  'tinyurl.com',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'j.mp',
  'short.link',
  'rb.gy',
];

/**
 * Default timeout for URL resolution in milliseconds
 */
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Check if a URL is from a known shortener service
 */
export function isShortUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return SHORTENER_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/**
 * Resolve a single shortened URL to its final destination
 * 
 * Uses HEAD requests to minimize data transfer and follows redirects
 * until reaching the final URL or hitting the redirect limit.
 * 
 * @param url - The URL to resolve
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns The resolved URL, or the original URL on failure
 */
export async function resolveUrl(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string> {
  // If not a shortened URL, return as-is
  if (!isShortUrl(url)) {
    return url;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Use HEAD request to minimize data transfer
      // redirect: 'follow' will automatically follow redirects
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Virtual-Bookshelf-Bot/1.0',
        },
      });

      clearTimeout(timeoutId);

      // Return the final URL after following redirects
      return response.url;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // If HEAD fails (some servers don't support it), try GET
      if (fetchError instanceof Error && fetchError.name !== 'AbortError') {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), timeoutMs);
        
        try {
          const getResponse = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            signal: controller2.signal,
            headers: {
              'User-Agent': 'Virtual-Bookshelf-Bot/1.0',
            },
          });
          
          clearTimeout(timeoutId2);
          return getResponse.url;
        } catch {
          clearTimeout(timeoutId2);
        }
      }
      
      throw fetchError;
    }
  } catch (error) {
    // On any error, return the original URL
    console.warn(`Failed to resolve URL ${url}:`, error instanceof Error ? error.message : error);
    return url;
  }
}

/**
 * Result of batch URL resolution
 */
export interface ResolvedUrls {
  /** Map from original URL to resolved URL */
  resolved: Record<string, string>;
  /** URLs that failed to resolve (returned original) */
  failed: string[];
}

/**
 * Resolve multiple URLs in parallel with concurrency control
 * 
 * @param urls - Array of URLs to resolve
 * @param concurrency - Maximum concurrent requests (default: 5)
 * @param timeoutMs - Timeout per URL in milliseconds (default: 5000)
 * @returns Object mapping original URLs to resolved URLs
 */
export async function resolveUrls(
  urls: string[],
  concurrency: number = 5,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ResolvedUrls> {
  const result: ResolvedUrls = {
    resolved: {},
    failed: [],
  };

  if (urls.length === 0) {
    return result;
  }

  // Process URLs in batches to respect concurrency limit
  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    batches.push(urls.slice(i, i + concurrency));
  }

  for (const batch of batches) {
    const promises = batch.map(async (url) => {
      const resolved = await resolveUrl(url, timeoutMs);
      return { original: url, resolved };
    });

    const results = await Promise.all(promises);
    
    for (const { original, resolved } of results) {
      result.resolved[original] = resolved;
      if (resolved === original && isShortUrl(original)) {
        result.failed.push(original);
      }
    }
  }

  return result;
}

/**
 * Extract the domain name from a URL for display purposes
 */
export function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove 'www.' prefix for cleaner display
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
