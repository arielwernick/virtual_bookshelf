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
 * Extract the destination URL from HTML content
 * LinkedIn's lnkd.in uses different methods:
 * 1. Direct page embedding with canonical tag pointing to external site
 * 2. Interstitial page with external link in data-tracking anchor
 */
export function extractCanonicalUrl(html: string, sourceUrl: string): string | null {
  try {
    // Method 1: Look for <link rel="canonical" href="..."> pointing to external site
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
                           html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
    
    if (canonicalMatch) {
      const canonical = canonicalMatch[1];
      // Validate it's a proper URL and different from source
      const canonicalUrl = new URL(canonical);
      const sourceUrlObj = new URL(sourceUrl);
      
      // Only return if it's a different domain (not just linkedin.com variations)
      if (canonicalUrl.hostname !== sourceUrlObj.hostname && 
          !canonicalUrl.hostname.includes('linkedin.com')) {
        return canonical;
      }
    }
    
    // Method 2: Look for LinkedIn interstitial page with external link
    // Pattern: <a ... data-tracking-control-name="external_url_click" ... href="https://...">
    const interstitialMatch = html.match(/data-tracking-control-name=["']external_url_click["'][^>]*href=["'](https?:\/\/[^"']+)["']/i) ||
                              html.match(/href=["'](https?:\/\/[^"']+)["'][^>]*data-tracking-control-name=["']external_url_click["']/i);
    
    if (interstitialMatch) {
      const externalUrl = interstitialMatch[1];
      // Validate it's a proper URL and not LinkedIn
      const externalUrlObj = new URL(externalUrl);
      if (!externalUrlObj.hostname.includes('linkedin.com') &&
          !externalUrlObj.hostname.includes('lnkd.in')) {
        return externalUrl;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

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

      // If no redirect found with manual mode, try follow mode with GET to get the HTML
      // Some shorteners (like lnkd.in) serve the page directly with a canonical tag
      const getResponse = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      const finalUrl = getResponse.url;
      
      // Check for LinkedIn redirect in final URL
      const extractedFromFinal = extractLinkedInRedirectUrl(finalUrl);
      if (extractedFromFinal) {
        clearTimeout(timeoutId);
        return extractedFromFinal;
      }
      
      // If the final URL is still a shortener URL, try to extract canonical from HTML
      if (isShortUrl(finalUrl) || finalUrl === url) {
        // Read the HTML to find canonical URL (only read first 50KB for performance)
        const html = await getResponse.text();
        const canonical = extractCanonicalUrl(html.substring(0, 50000), url);
        if (canonical) {
          clearTimeout(timeoutId);
          return canonical;
        }
      }

      clearTimeout(timeoutId);
      return finalUrl;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // If the first request fails, try again with fresh controller
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
          
          const finalUrl = getResponse.url;
          
          // Check for LinkedIn redirect in final URL
          const extractedFromFinal = extractLinkedInRedirectUrl(finalUrl);
          if (extractedFromFinal) {
            clearTimeout(timeoutId2);
            return extractedFromFinal;
          }
          
          // If still a shortener URL, try to extract canonical from HTML
          if (isShortUrl(finalUrl) || finalUrl === url) {
            const html = await getResponse.text();
            const canonical = extractCanonicalUrl(html.substring(0, 50000), url);
            if (canonical) {
              clearTimeout(timeoutId2);
              return canonical;
            }
          }
          
          clearTimeout(timeoutId2);
          return finalUrl;
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
