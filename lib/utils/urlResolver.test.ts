import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isShortUrl, resolveUrl, resolveUrls, getDomain, extractLinkedInRedirectUrl, needsResolution, extractCanonicalUrl, shortenerRequestUrl } from './urlResolver';

// ============================================================================
// extractCanonicalUrl Tests
// ============================================================================

describe('extractCanonicalUrl', () => {
  it('extracts canonical URL from HTML', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="canonical" href="https://aws.amazon.com/blogs/architecture/">
          <title>AWS Architecture</title>
        </head>
      </html>
    `;
    expect(extractCanonicalUrl(html, 'https://lnkd.in/abc123')).toBe('https://aws.amazon.com/blogs/architecture/');
  });

  it('extracts canonical with reversed attributes order', () => {
    const html = `<link href="https://netflixtechblog.com/article" rel="canonical">`;
    expect(extractCanonicalUrl(html, 'https://lnkd.in/xyz')).toBe('https://netflixtechblog.com/article');
  });

  it('returns null if canonical is same domain as source', () => {
    const html = `<link rel="canonical" href="https://lnkd.in/abc123">`;
    expect(extractCanonicalUrl(html, 'https://lnkd.in/abc123')).toBeNull();
  });

  it('returns null if canonical is LinkedIn', () => {
    const html = `<link rel="canonical" href="https://www.linkedin.com/posts/abc">`;
    expect(extractCanonicalUrl(html, 'https://lnkd.in/abc123')).toBeNull();
  });

  it('returns null if no canonical found', () => {
    const html = `<html><head><title>Page</title></head></html>`;
    expect(extractCanonicalUrl(html, 'https://lnkd.in/abc')).toBeNull();
  });

  it('returns null for invalid canonical URL', () => {
    const html = `<link rel="canonical" href="not-a-valid-url">`;
    expect(extractCanonicalUrl(html, 'https://lnkd.in/abc')).toBeNull();
  });

  it('handles real LinkedIn shortlink page structure', () => {
    // Simulates what lnkd.in returns for AWS Architecture Blog
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta name="pageKey" content="d_shortlink_frontend_external_link_redirect_interstitial">
          <link rel="canonical" href="https://aws.amazon.com/blogs/architecture/">
          <title>LinkedIn</title>
        </head>
        <body><!-- AWS content embedded --></body>
      </html>
    `;
    expect(extractCanonicalUrl(html, 'https://lnkd.in/gqjh88PS')).toBe('https://aws.amazon.com/blogs/architecture/');
  });

  it('extracts URL from LinkedIn interstitial page', () => {
    // Simulates what lnkd.in returns for Netflix Tech Blog (interstitial pattern)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="canonical" href="https://www.linkedin.com">
          <title>LinkedIn</title>
        </head>
        <body>
          <main>
            <h1>This link will take you to a page that's not on LinkedIn</h1>
            <a class="artdeco-button" 
               data-tracking-control-name="external_url_click" 
               data-tracking-will-navigate
               href="https://netflixtechblog.com">
                https://netflixtechblog.com
            </a>
          </main>
        </body>
      </html>
    `;
    expect(extractCanonicalUrl(html, 'https://lnkd.in/gNE8Cs6Z')).toBe('https://netflixtechblog.com');
  });

  it('extracts URL from interstitial with reversed attribute order', () => {
    const html = `<a href="https://discord.com/blog/engineering" data-tracking-control-name="external_url_click">Link</a>`;
    expect(extractCanonicalUrl(html, 'https://lnkd.in/abc')).toBe('https://discord.com/blog/engineering');
  });
});

// ============================================================================
// extractLinkedInRedirectUrl Tests
// ============================================================================

describe('extractLinkedInRedirectUrl', () => {
  it('extracts URL from linkedin.com/redir/redirect', () => {
    const linkedInUrl = 'https://www.linkedin.com/redir/redirect?url=https%3A%2F%2Fexample.com%2Fpage&trk=something';
    expect(extractLinkedInRedirectUrl(linkedInUrl)).toBe('https://example.com/page');
  });

  it('extracts URL from linkedin.com/safety/go', () => {
    const linkedInUrl = 'https://www.linkedin.com/safety/go?url=https%3A%2F%2Fgithub.com%2Fuser%2Frepo';
    expect(extractLinkedInRedirectUrl(linkedInUrl)).toBe('https://github.com/user/repo');
  });

  it('extracts URL from linkedin.com/csp/redirect', () => {
    const linkedInUrl = 'https://linkedin.com/csp/redirect?url=https%3A%2F%2Fmedium.com%2F%40user%2Farticle';
    expect(extractLinkedInRedirectUrl(linkedInUrl)).toBe('https://medium.com/@user/article');
  });

  it('handles complex encoded URLs', () => {
    const target = 'https://example.com/page?foo=bar&baz=qux';
    const linkedInUrl = `https://www.linkedin.com/redir/redirect?url=${encodeURIComponent(target)}`;
    expect(extractLinkedInRedirectUrl(linkedInUrl)).toBe(target);
  });

  it('returns null for regular LinkedIn URLs', () => {
    expect(extractLinkedInRedirectUrl('https://www.linkedin.com/in/johndoe')).toBeNull();
    expect(extractLinkedInRedirectUrl('https://www.linkedin.com/posts/johndoe-123')).toBeNull();
    expect(extractLinkedInRedirectUrl('https://www.linkedin.com/company/acme')).toBeNull();
  });

  it('returns null for non-LinkedIn URLs', () => {
    expect(extractLinkedInRedirectUrl('https://example.com/redir/redirect?url=foo')).toBeNull();
    expect(extractLinkedInRedirectUrl('https://google.com')).toBeNull();
  });

  it('returns null for redirect URLs without url parameter', () => {
    expect(extractLinkedInRedirectUrl('https://www.linkedin.com/redir/redirect?trk=something')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(extractLinkedInRedirectUrl('not-a-url')).toBeNull();
    expect(extractLinkedInRedirectUrl('')).toBeNull();
  });

  it('returns null if extracted URL is invalid', () => {
    const linkedInUrl = 'https://www.linkedin.com/redir/redirect?url=not-a-valid-url';
    expect(extractLinkedInRedirectUrl(linkedInUrl)).toBeNull();
  });
});

// ============================================================================
// needsResolution Tests
// ============================================================================

describe('needsResolution', () => {
  it('returns true for short URLs', () => {
    expect(needsResolution('https://lnkd.in/abc123')).toBe(true);
    expect(needsResolution('https://bit.ly/xyz')).toBe(true);
  });

  it('returns true for LinkedIn redirect URLs', () => {
    expect(needsResolution('https://www.linkedin.com/redir/redirect?url=https%3A%2F%2Fexample.com')).toBe(true);
  });

  it('returns false for regular URLs', () => {
    expect(needsResolution('https://example.com/page')).toBe(false);
    expect(needsResolution('https://github.com/user/repo')).toBe(false);
  });
});

// ============================================================================
// isShortUrl Tests
// ============================================================================

describe('isShortUrl', () => {
  it('identifies lnkd.in as shortener', () => {
    expect(isShortUrl('https://lnkd.in/abc123')).toBe(true);
  });

  it('identifies bit.ly as shortener', () => {
    expect(isShortUrl('https://bit.ly/3xYz123')).toBe(true);
  });

  it('identifies t.co as shortener', () => {
    expect(isShortUrl('https://t.co/AbCdEf')).toBe(true);
  });

  it('identifies tinyurl.com as shortener', () => {
    expect(isShortUrl('https://tinyurl.com/y6abc123')).toBe(true);
  });

  it('returns false for regular domains', () => {
    expect(isShortUrl('https://example.com/page')).toBe(false);
    expect(isShortUrl('https://github.com/user/repo')).toBe(false);
    expect(isShortUrl('https://medium.com/@user/article')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isShortUrl('not-a-url')).toBe(false);
    expect(isShortUrl('')).toBe(false);
  });

  it('handles URLs without protocol gracefully', () => {
    expect(isShortUrl('bit.ly/abc')).toBe(false); // Not a valid URL
  });
});

// ============================================================================
// getDomain Tests
// ============================================================================

describe('getDomain', () => {
  it('extracts domain from https URL', () => {
    expect(getDomain('https://example.com/page')).toBe('example.com');
  });

  it('extracts domain from http URL', () => {
    expect(getDomain('http://example.com')).toBe('example.com');
  });

  it('removes www prefix', () => {
    expect(getDomain('https://www.example.com/page')).toBe('example.com');
  });

  it('preserves subdomain', () => {
    expect(getDomain('https://blog.example.com/post')).toBe('blog.example.com');
  });

  it('returns original string for invalid URL', () => {
    expect(getDomain('not-a-url')).toBe('not-a-url');
  });
});

// ============================================================================
// resolveUrl Tests (with mocked fetch)
// ============================================================================

describe('resolveUrl', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns original URL if not a shortener', async () => {
    const url = 'https://example.com/regular-page';
    const result = await resolveUrl(url);
    expect(result).toBe(url);
  });

  it('extracts URL from LinkedIn redirect without fetch', async () => {
    const linkedInUrl = 'https://www.linkedin.com/redir/redirect?url=https%3A%2F%2Fexample.com%2Fpage';
    const result = await resolveUrl(linkedInUrl);
    expect(result).toBe('https://example.com/page');
    // Should not make any fetch calls
  });

  it('extracts URL from LinkedIn safety redirect', async () => {
    const linkedInUrl = 'https://www.linkedin.com/safety/go?url=https%3A%2F%2Fgithub.com%2Frepo';
    const result = await resolveUrl(linkedInUrl);
    expect(result).toBe('https://github.com/repo');
  });

  // A shortener answers with a redirect; the server reads where it points
  // and never requests that address itself.
  const redirectTo = (location: string) => ({
    status: 301,
    url: '',
    headers: new Headers({ location }),
  });

  it('resolves a shortened URL from the shortener\'s redirect, without visiting the destination', async () => {
    const shortUrl = 'https://bit.ly/abc123';
    const resolvedUrl = 'https://example.com/final-destination';
    global.fetch = vi.fn().mockResolvedValue(redirectTo(resolvedUrl));

    const result = await resolveUrl(shortUrl);

    expect(result).toBe(resolvedUrl);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      shortUrl,
      expect.objectContaining({ method: 'HEAD', redirect: 'manual' })
    );
  });

  it('extracts real URL when the shortener points at a LinkedIn redirect', async () => {
    const shortUrl = 'https://lnkd.in/abc123';
    const linkedInRedirect = 'https://www.linkedin.com/redir/redirect?url=https%3A%2F%2Fexample.com%2Ftarget';
    global.fetch = vi.fn().mockResolvedValue(redirectTo(linkedInRedirect));

    const result = await resolveUrl(shortUrl);

    expect(result).toBe('https://example.com/target');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to a GET on the shortener if HEAD fails, still without following', async () => {
    const shortUrl = 'https://bit.ly/abc123';
    const resolvedUrl = 'https://example.com/final-destination';

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('HEAD not supported'));
      return Promise.resolve(redirectTo(resolvedUrl));
    });

    const result = await resolveUrl(shortUrl);

    expect(result).toBe(resolvedUrl);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(global.fetch).mock.calls[1]).toEqual([
      shortUrl,
      expect.objectContaining({ method: 'GET', redirect: 'manual' }),
    ]);
  });

  it('reads the destination from the shortener\'s page when it does not redirect', async () => {
    global.fetch = vi.fn().mockImplementation((_url: string, init: RequestInit) =>
      init.method === 'HEAD'
        ? Promise.resolve({ status: 200, url: '', headers: new Headers() })
        : Promise.resolve({
            status: 200,
            url: '',
            headers: new Headers(),
            text: async () => '<html><head><link rel="canonical" href="https://example.com/real"></head></html>',
          })
    );

    expect(await resolveUrl('https://bit.ly/abc123')).toBe('https://example.com/real');
  });

  it('stops when two short links point at each other', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) =>
      Promise.resolve(redirectTo(url.includes('bit.ly') ? 'https://t.co/b' : 'https://bit.ly/a'))
    );

    const result = await resolveUrl('https://bit.ly/a');

    expect(['https://bit.ly/a', 'https://t.co/b']).toContain(result);
    expect(vi.mocked(global.fetch).mock.calls.length).toBeLessThanOrEqual(12);
  });

  it('returns original URL on timeout', async () => {
    const shortUrl = 'https://bit.ly/abc123';

    global.fetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 100);
      });
    });

    const result = await resolveUrl(shortUrl, 50);
    expect(result).toBe(shortUrl);
  });

  it('returns original URL on network error', async () => {
    const shortUrl = 'https://bit.ly/abc123';

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await resolveUrl(shortUrl);
    expect(result).toBe(shortUrl);
  });
});

// ============================================================================
// resolveUrls Tests (with mocked fetch)
// ============================================================================

describe('resolveUrls', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('resolves multiple URLs', async () => {
    const urls = ['https://bit.ly/abc', 'https://t.co/def'];
    const resolved = ['https://example.com/1', 'https://example.com/2'];

    let callIndex = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      // Each URL makes one call with manual redirect
      const resolvedUrl = resolved[callIndex++];
      const headers = new Headers();
      headers.set('location', resolvedUrl);
      return Promise.resolve({ 
        status: 302,
        url: resolvedUrl,
        headers,
      });
    });

    const result = await resolveUrls(urls);

    expect(result.resolved['https://bit.ly/abc']).toBe('https://example.com/1');
    expect(result.resolved['https://t.co/def']).toBe('https://example.com/2');
  });

  it('handles empty array', async () => {
    const result = await resolveUrls([]);
    expect(result.resolved).toEqual({});
    expect(result.failed).toEqual([]);
  });

  it('tracks failed resolutions', async () => {
    const urls = ['https://bit.ly/fail'];

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await resolveUrls(urls);

    expect(result.resolved['https://bit.ly/fail']).toBe('https://bit.ly/fail');
    expect(result.failed).toContain('https://bit.ly/fail');
  });

  it('respects concurrency limit', async () => {
    const urls = Array.from({ length: 10 }, (_, i) => `https://bit.ly/${i}`);
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      currentConcurrent++;
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
      await new Promise((resolve) => setTimeout(resolve, 10));
      currentConcurrent--;
      return { url: url.replace('bit.ly', 'example.com') };
    });

    await resolveUrls(urls, 3);

    // With concurrency of 3, we should never have more than 3 concurrent requests
    expect(maxConcurrent).toBeLessThanOrEqual(3);
  });

  it('passes through non-shortened URLs without fetch', async () => {
    const urls = ['https://example.com/regular'];

    global.fetch = vi.fn();

    const result = await resolveUrls(urls);

    expect(result.resolved['https://example.com/regular']).toBe('https://example.com/regular');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('shortenerRequestUrl', () => {
  it('rebuilds a short link on the shortener\'s own address, keeping path and query', () => {
    expect(shortenerRequestUrl('https://bit.ly/abc123')).toBe('https://bit.ly/abc123');
    expect(shortenerRequestUrl('http://www.bit.ly/abc123?x=1')).toBe('https://bit.ly/abc123?x=1');
    expect(shortenerRequestUrl('https://T.CO/xyz')).toBe('https://t.co/xyz');
    expect(shortenerRequestUrl('https://lnkd.in/gAbCdEf')).toBe('https://lnkd.in/gAbCdEf');
  });

  it('never keeps a host, port or credentials from the pasted text', () => {
    expect(shortenerRequestUrl('https://user:pass@bit.ly:8080/abc')).toBe('https://bit.ly/abc');
    expect(shortenerRequestUrl('https://bit.ly//169.254.169.254/latest')).toBe(
      'https://bit.ly/169.254.169.254/latest'
    );
  });

  it('refuses anything that is not a known shortener', () => {
    expect(shortenerRequestUrl('https://example.com/abc')).toBeNull();
    expect(shortenerRequestUrl('https://bit.ly.evil.example/abc')).toBeNull();
    expect(shortenerRequestUrl('http://127.0.0.1/abc')).toBeNull();
    expect(shortenerRequestUrl('not a url')).toBeNull();
  });
});

describe('resolveUrl only requests a shortener\'s own address', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('requests the rebuilt address, not the pasted host', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 301,
      url: '',
      headers: new Headers({ location: 'https://example.com/final' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await resolveUrl('http://user:pass@www.bit.ly:8080/abc');

    expect(result).toBe('https://example.com/final');
    expect(fetchMock.mock.calls[0][0]).toBe('https://bit.ly/abc');
  });

  it('gives back the pasted link when nothing better is found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      url: '',
      headers: new Headers(),
      text: async () => '<html></html>',
    }) as unknown as typeof fetch;

    expect(await resolveUrl('https://bit.ly/abc')).toBe('https://bit.ly/abc');
  });
});
