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

/** Short links followed through other short links before giving up */
const MAX_RESOLVE_DEPTH = 5;

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
  // Exact host or a subdomain. A substring test would also match look-alikes
  // such as "linkedin.com.example.org".
  const host = hostname.toLowerCase();
  return ['linkedin.com', 'lnkd.in'].some((domain) => host === domain || host.endsWith(`.${domain}`));
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
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  depth: number = 0
): Promise<string> {
  // Short links that point at other short links: stop after a few, so two
  // links pointing at each other cannot loop
  if (depth > MAX_RESOLVE_DEPTH) return url;

  // Check for LinkedIn redirect wrapper first (no fetch needed)
  const linkedInTarget = extractLinkedInRedirectUrl(url);
  if (linkedInTarget) {
    return resolveUrl(linkedInTarget, timeoutMs, depth + 1);
  }

  // Skip non-shortened URLs
  if (!isShortUrl(url)) {
    return url;
  }

  try {
    return await resolveWithFetch(url, timeoutMs, depth);
  } catch (error) {
    console.warn(`Failed to resolve URL ${url}:`, error instanceof Error ? error.message : error);
    return url;
  }
}

/**
 * The URL to request for a short link, rebuilt on the shortener's own fixed
 * address. Returns null for anything that is not one of the known shorteners.
 *
 * Short links come from text a person pastes. Only the path and query are
 * taken from it; the scheme and host are always one of the literals below,
 * so a pasted link can never make the server request another address. The
 * server reads where the shortener points but never requests that address.
 */
export function shortenerRequestUrl(url: string): string | null {
  const parsed = parseUrl(url);
  if (!parsed) return null;

  const rest = `${parsed.pathname.replace(/^\/+/, '')}${parsed.search}`;
  switch (parsed.hostname.toLowerCase().replace(/^www\./, '')) {
    case 'lnkd.in':
      return `https://lnkd.in/${rest}`;
    case 'bit.ly':
      return `https://bit.ly/${rest}`;
    case 't.co':
      return `https://t.co/${rest}`;
    case 'tinyurl.com':
      return `https://tinyurl.com/${rest}`;
    case 'goo.gl':
      return `https://goo.gl/${rest}`;
    case 'ow.ly':
      return `https://ow.ly/${rest}`;
    case 'is.gd':
      return `https://is.gd/${rest}`;
    case 'buff.ly':
      return `https://buff.ly/${rest}`;
    case 'j.mp':
      return `https://j.mp/${rest}`;
    case 'short.link':
      return `https://short.link/${rest}`;
    case 'rb.gy':
      return `https://rb.gy/${rest}`;
    default:
      return null;
  }
}

/**
 * Resolve a shortened URL by fetching it
 */
async function resolveWithFetch(shortUrl: string, timeoutMs: number, depth: number): Promise<string> {
  // Only a known shortener's own address is ever requested (see above)
  const url = shortenerRequestUrl(shortUrl);
  if (!url) return shortUrl;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Try HEAD request first for redirect detection (faster)
    const redirectUrl = await tryHeadRedirect(url, controller.signal);
    if (redirectUrl && redirectUrl !== url) {
      clearTimeout(timeoutId);
      return processResolvedUrl(redirectUrl, timeoutMs, depth);
    }

    // Fall back to a GET on the shortener itself. Redirects are read, not
    // followed: the destination is never requested by the server.
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: FETCH_HEADERS,
    });

    clearTimeout(timeoutId);
    const location =
      response.status >= 300 && response.status < 400 ? response.headers.get('location') : null;
    if (location) {
      return processResolvedUrl(new URL(location, url).href, timeoutMs, depth);
    }
    const resolved = await extractFinalUrl(response, url, url);
    return resolved === url ? shortUrl : resolved;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Try to get redirect URL via HEAD request
 */
async function tryHeadRedirect(url: string, signal: AbortSignal): Promise<string | null> {
  // Callers pass a URL from shortenerRequestUrl: a known shortener's own address
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
async function processResolvedUrl(url: string, timeoutMs: number, depth: number): Promise<string> {
  // Check if it's a LinkedIn redirect wrapper
  const extracted = extractLinkedInRedirectUrl(url);
  if (extracted) {
    return resolveUrl(extracted, timeoutMs, depth + 1);
  }
  
  // If it's another shortener, resolve recursively
  if (isShortUrl(url)) {
    return resolveUrl(url, timeoutMs, depth + 1);
  }
  
  return url;
}

/**
 * Extract the final destination URL from a fetch response
 */
async function extractFinalUrl(
  response: Response,
  finalUrl: string,
  originalUrl: string
): Promise<string> {  
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
