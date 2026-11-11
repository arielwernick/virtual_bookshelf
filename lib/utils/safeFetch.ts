/**
 * Fetching URLs that came from a person, safely.
 *
 * The server fetches two kinds of user-supplied URL: item cover images (to
 * draw share cards) and shortened links (to find where they lead). Left
 * unchecked, either could be pointed at an address that is only reachable
 * from inside the hosting network, or at a huge file.
 *
 * `fetchPublicUrl` therefore:
 *   - only fetches http(s) URLs whose host is a public name or address,
 *   - follows redirects itself, checking every hop the same way,
 *   - gives up after a few hops.
 *
 * Limit: the check is on the URL as written. A public hostname that resolves
 * to a private address is not caught, because the edge runtime cannot look up
 * DNS. Run on a platform with no private network behind it (as today), this
 * is a second line, not the only one.
 */

const MAX_REDIRECTS = 5;

function isPrivateIpv4(host: string): boolean {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  return (
    a === 0 || // "this" network
    a === 10 || // private
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, incl. cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // private
    (a === 192 && b === 168) || // private
    a >= 224 // multicast and reserved
  );
}

function isPrivateIpv6(host: string): boolean {
  // URL.hostname keeps the brackets on IPv6 literals
  const address = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (address === '::' || address === '::1') return true;
  if (/^f[cd]/.test(address)) return true; // fc00::/7 unique local
  if (/^fe[89ab]/.test(address)) return true; // fe80::/10 link-local

  // IPv4-mapped (::ffff:a.b.c.d, which URL prints as ::ffff:hhhh:hhhh)
  const mapped = address.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mapped) {
    const high = parseInt(mapped[1], 16);
    const low = parseInt(mapped[2], 16);
    return isPrivateIpv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  }
  const dotted = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return dotted ? isPrivateIpv4(dotted[1]) : false;
}

/**
 * True when the URL is http(s) and its host is not a loopback, private,
 * link-local or internal-only name or address.
 *
 * `new URL()` already normalises odd spellings of an IPv4 address (decimal,
 * hex, octal) to dotted form, so those are covered by the IPv4 check.
 */
export function isPublicHttpUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.username || url.password) return false;

  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host) return false;

  if (host.startsWith('[')) return !isPrivateIpv6(host);
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return !isPrivateIpv4(host);

  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    !host.includes('.') // single-label names only resolve inside a network
  ) {
    return false;
  }
  return true;
}

export class UnsafeUrlError extends Error {
  constructor(url: string) {
    super(`Refusing to fetch a non-public URL: ${url.slice(0, 200)}`);
    this.name = 'UnsafeUrlError';
  }
}

export interface PublicFetchResult {
  response: Response;
  /** Where the request ended up after redirects. */
  finalUrl: string;
}

/**
 * fetch(), restricted to public http(s) URLs, with every redirect hop
 * checked. Throws UnsafeUrlError for a URL (or redirect target) that is not
 * public, and a plain Error after too many redirects.
 */
export async function fetchPublicUrl(
  url: string,
  init: Omit<RequestInit, 'redirect'> = {}
): Promise<PublicFetchResult> {
  let current = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isPublicHttpUrl(current)) throw new UnsafeUrlError(current);

    const response = await fetch(current, { ...init, redirect: 'manual' });
    const location =
      response.status >= 300 && response.status < 400 ? response.headers?.get('location') : null;

    if (!location) {
      // response.url is set when the runtime followed redirects on its own
      return { response, finalUrl: response.url || current };
    }
    current = new URL(location, current).href;
  }

  throw new Error('Too many redirects');
}
