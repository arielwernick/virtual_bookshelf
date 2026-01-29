/**
 * URL Resolver Utility
 * 
 * Resolves shortened URLs (lnkd.in, bit.ly, t.co, etc.) to their
 * final destination URLs by following redirects.
 * Also extracts real URLs from tracking/redirect wrappers.
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
 * User agent that looks like a browser to avoid bot detection
 */
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Extract the real URL from a LinkedIn redirect wrapper
 * LinkedIn wraps external links like: linkedin.com/redir/redirect?url=<encoded_url>
 * or linkedin.com/safety/go?url=<encoded_url>
 */
export function extractLinkedInRedirectUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    // Check if it's a LinkedIn redirect URL
    if (!hostname.includes('linkedin.com')) {
      return null;
    }
    
    // Common LinkedIn redirect paths
    const redirectPaths = ['/redir/redirect', '/safety/go', '/csp/redirect'];
    const isRedirectPath = redirectPaths.some(path => 
      parsed.pathname.toLowerCase().startsWith(path)
    );
    
    if (!isRedirectPath) {
      return null;
    }
    
    // Extract the 'url' parameter
    const targetUrl = parsed.searchParams.get('url');
    if (targetUrl) {
      // Validate it's a proper URL
      new URL(targetUrl);
      return targetUrl;
    }
    
    return null;
  } catch {
    return null;
  }
}

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
 * Check if a URL needs resolution (shortened or redirect wrapper)
 */
export function needsResolution(url: string): boolean {
  return isShortUrl(url) || extractLinkedInRedirectUrl(url) !== null;
}

/**
 * Resolve a single shortened URL to its final destination
 * 
 * Uses HEAD requests to minimize data transfer and follows redirects
 * until reaching the final URL or hitting the redirect limit.
 * Also extracts URLs from tracking wrappers (e.g., LinkedIn redirect URLs).
 * 
 * @param url - The URL to resolve
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns The resolved URL, or the original URL on failure
 */
export async function resolveUrl(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string> {
  // First, check if it's a LinkedIn redirect wrapper - extract directly without fetch
  const linkedInTarget = extractLinkedInRedirectUrl(url);
  if (linkedInTarget) {
    // The extracted URL might itself be shortened, so resolve it recursively
    return resolveUrl(linkedInTarget, timeoutMs);
  }

  // If not a shortened URL, return as-is
  if (!isShortUrl(url)) {
    return url;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // First try: manual redirect to get Location header (faster, works for most shorteners)
      const manualResponse = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual', // Don't auto-follow, check Location header
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      // Check for redirect
      if (manualResponse.status >= 300 && manualResponse.status < 400) {
        const location = manualResponse.headers.get('location');
        if (location) {
          clearTimeout(timeoutId);
          // Location might be relative or another shortened URL
          const absoluteUrl = new URL(location, url).href;
          // Check if the redirect target is a LinkedIn redirect wrapper
          const extracted = extractLinkedInRedirectUrl(absoluteUrl);
          if (extracted) {
            return resolveUrl(extracted, timeoutMs);
          }
          // If it's another shortener, resolve recursively
          if (isShortUrl(absoluteUrl)) {
            return resolveUrl(absoluteUrl, timeoutMs);
          }
          return absoluteUrl;
        }
      }

      // If no redirect found with manual mode, try follow mode
      const followResponse = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      clearTimeout(timeoutId);

      // The final URL might be a LinkedIn redirect - extract if so
      const finalUrl = followResponse.url;
      const extractedFromFinal = extractLinkedInRedirectUrl(finalUrl);
      return extractedFromFinal || finalUrl;
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
              'User-Agent': USER_AGENT,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });
          
          clearTimeout(timeoutId2);
          
          // Check for LinkedIn redirect in final URL
          const finalUrl = getResponse.url;
          const extractedFromFinal = extractLinkedInRedirectUrl(finalUrl);
          return extractedFromFinal || finalUrl;
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
