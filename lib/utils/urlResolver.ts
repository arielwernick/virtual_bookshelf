/**
 * URL Resolver Utility
 * 
 * Resolves shortened URLs (lnkd.in, bit.ly, t.co, etc.) to their
 * final destination URLs by following redirects and extracting
 * real URLs from tracking wrappers.
 */

// =============================================================================
// Constants
// =============================================================================

/** Known URL shortener domains */
const SHORTENER_DOMAINS = new Set([
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
]);

/** LinkedIn redirect paths that wrap external URLs */
const LINKEDIN_REDIRECT_PATHS = ['/redir/redirect', '/safety/go', '/csp/redirect'];

/** Default timeout for URL resolution */
const DEFAULT_TIMEOUT_MS = 5000;

/** Max HTML to read when extracting canonical URLs (50KB) */
const MAX_HTML_READ = 50000;

/** Browser-like User-Agent to avoid bot detection */
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// =============================================================================
// URL Parsing Helpers
// =============================================================================

/**
 * Safely parse a URL, returning null on failure
 */
function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * Check if a hostname belongs to LinkedIn
 */
function isLinkedInHost(hostname: string): boolean {
  return hostname.includes('linkedin.com') || hostname.includes('lnkd.in');
}

// =============================================================================
// URL Detection Functions
// =============================================================================

/**
 * Check if a URL is from a known shortener service
 */
export function isShortUrl(url: string): boolean {
  const parsed = parseUrl(url);
  if (!parsed) return false;
  
  const hostname = parsed.hostname.toLowerCase();
  return SHORTENER_DOMAINS.has(hostname) || 
    [...SHORTENER_DOMAINS].some(domain => hostname.endsWith(`.${domain}`));
}

/**
 * Check if a URL needs resolution (shortened or redirect wrapper)
 */
export function needsResolution(url: string): boolean {
  return isShortUrl(url) || extractLinkedInRedirectUrl(url) !== null;
}

// =============================================================================
// URL Extraction Functions
// =============================================================================

/**
 * Extract the real URL from a LinkedIn redirect wrapper
 * 
 * LinkedIn wraps external links like:
 * - linkedin.com/redir/redirect?url=<encoded_url>
 * - linkedin.com/safety/go?url=<encoded_url>
 */
export function extractLinkedInRedirectUrl(url: string): string | null {
  const parsed = parseUrl(url);
  if (!parsed || !parsed.hostname.includes('linkedin.com')) return null;
  
  const isRedirectPath = LINKEDIN_REDIRECT_PATHS.some(path => 
    parsed.pathname.toLowerCase().startsWith(path)
  );
  if (!isRedirectPath) return null;
  
  const targetUrl = parsed.searchParams.get('url');
  if (!targetUrl || !parseUrl(targetUrl)) return null;
  
  return targetUrl;
}

/**
 * Extract destination URL from HTML content
 * 
 * LinkedIn's lnkd.in uses different methods:
 * 1. Direct page embedding with canonical tag pointing to external site
 * 2. Interstitial "leaving LinkedIn" page with tracking anchor
 */
export function extractCanonicalUrl(html: string, sourceUrl: string): string | null {
  const sourceHost = parseUrl(sourceUrl)?.hostname;
  if (!sourceHost) return null;

  // Method 1: <link rel="canonical" href="...">
  const canonicalUrl = extractFromCanonicalTag(html, sourceHost);
  if (canonicalUrl) return canonicalUrl;
  
  // Method 2: <a data-tracking-control-name="external_url_click" href="...">
  const interstitialUrl = extractFromInterstitialPage(html);
  if (interstitialUrl) return interstitialUrl;
  
  return null;
}

/**
 * Extract URL from canonical link tag
 */
function extractFromCanonicalTag(html: string, sourceHost: string): string | null {
  const patterns = [
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const canonical = parseUrl(match[1]);
      if (canonical && 
          canonical.hostname !== sourceHost && 
          !isLinkedInHost(canonical.hostname)) {
        return match[1];
      }
    }
  }
  return null;
}

/**
 * Extract URL from LinkedIn's interstitial "external link" page
 */
function extractFromInterstitialPage(html: string): string | null {
  const patterns = [
    /data-tracking-control-name=["']external_url_click["'][^>]*href=["'](https?:\/\/[^"']+)["']/i,
    /href=["'](https?:\/\/[^"']+)["'][^>]*data-tracking-control-name=["']external_url_click["']/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const parsed = parseUrl(match[1]);
      if (parsed && !isLinkedInHost(parsed.hostname)) {
        return match[1];
      }
    }
  }
  return null;
}

// =============================================================================
// URL Resolution
// =============================================================================

/**
 * Resolve a single shortened URL to its final destination
 * 
 * Resolution strategy:
 * 1. Extract URL from LinkedIn redirect wrappers (no fetch needed)
 * 2. Follow HTTP redirects via Location header
 * 3. Fetch HTML and extract canonical/interstitial URLs
 */
export async function resolveUrl(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string> {
  // Check for LinkedIn redirect wrapper first (no fetch needed)
  const linkedInTarget = extractLinkedInRedirectUrl(url);
  if (linkedInTarget) {
    return resolveUrl(linkedInTarget, timeoutMs);
  }

  // Skip non-shortened URLs
  if (!isShortUrl(url)) {
    return url;
  }

  try {
    return await resolveWithFetch(url, timeoutMs);
  } catch (error) {
    console.warn(`Failed to resolve URL ${url}:`, error instanceof Error ? error.message : error);
    return url;
  }
}

/**
 * Resolve a shortened URL by fetching it
 */
async function resolveWithFetch(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Try HEAD request first for redirect detection (faster)
    const redirectUrl = await tryHeadRedirect(url, controller.signal);
    if (redirectUrl && redirectUrl !== url) {
      clearTimeout(timeoutId);
      return processResolvedUrl(redirectUrl, timeoutMs);
    }

    // Fall back to GET request and HTML extraction
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: FETCH_HEADERS,
    });

    clearTimeout(timeoutId);
    return await extractFinalUrl(response, url);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Try to get redirect URL via HEAD request
 */
async function tryHeadRedirect(url: string, signal: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal,
      headers: FETCH_HEADERS,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        return new URL(location, url).href;
      }
    }
  } catch {
    // HEAD might not be supported, fall through to GET
  }
  return null;
}

/**
 * Process a URL that came from a redirect
 */
async function processResolvedUrl(url: string, timeoutMs: number): Promise<string> {
  // Check if it's a LinkedIn redirect wrapper
  const extracted = extractLinkedInRedirectUrl(url);
  if (extracted) {
    return resolveUrl(extracted, timeoutMs);
  }
  
  // If it's another shortener, resolve recursively
  if (isShortUrl(url)) {
    return resolveUrl(url, timeoutMs);
  }
  
  return url;
}

/**
 * Extract the final destination URL from a fetch response
 */
async function extractFinalUrl(response: Response, originalUrl: string): Promise<string> {
  const finalUrl = response.url;
  
  // Check for LinkedIn redirect in final URL
  const extracted = extractLinkedInRedirectUrl(finalUrl);
  if (extracted) return extracted;
  
  // If still on a shortener, extract from HTML
  if (isShortUrl(finalUrl) || finalUrl === originalUrl) {
    const html = await response.text();
    const canonical = extractCanonicalUrl(html.substring(0, MAX_HTML_READ), originalUrl);
    if (canonical) return canonical;
  }
  
  return finalUrl;
}

// =============================================================================
// Batch Resolution
// =============================================================================

/** Result of batch URL resolution */
export interface ResolvedUrls {
  /** Map from original URL to resolved URL */
  resolved: Record<string, string>;
  /** URLs that failed to resolve (returned original) */
  failed: string[];
}

/**
 * Resolve multiple URLs in parallel with concurrency control
 */
export async function resolveUrls(
  urls: string[],
  concurrency: number = 5,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ResolvedUrls> {
  const result: ResolvedUrls = { resolved: {}, failed: [] };
  if (urls.length === 0) return result;

  // Process in batches to respect concurrency limit
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (url) => ({
        original: url,
        resolved: await resolveUrl(url, timeoutMs),
      }))
    );

    for (const { original, resolved } of results) {
      result.resolved[original] = resolved;
      if (resolved === original && isShortUrl(original)) {
        result.failed.push(original);
      }
    }
  }

  return result;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extract the domain name from a URL for display purposes
 */
export function getDomain(url: string): string {
  const parsed = parseUrl(url);
  if (!parsed) return url;
  return parsed.hostname.replace(/^www\./, '');
}
