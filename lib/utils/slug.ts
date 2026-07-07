/**
 * SEO-friendly share URL slugs.
 *
 * Public shelf URLs embed the shelf name ahead of the share token:
 *   /s/my-favorite-books-Xk9mP2vL
 *
 * The token (see generateShortToken) is always the segment after the LAST
 * hyphen — its alphabet contains no hyphens, so parsing is unambiguous.
 * The slug is purely cosmetic: lookups use only the token, and requests
 * with a missing or stale slug are permanently redirected to the
 * canonical URL.
 */

/** Keep URLs readable — long names are truncated at a word boundary. */
const MAX_SLUG_LENGTH = 60;

/**
 * Convert a shelf name to a URL-safe slug
 *
 * @example
 * slugifyShelfName('My Favorite Books!') // "my-favorite-books"
 * slugifyShelfName('Café Reads — 2026') // "cafe-reads-2026"
 * slugifyShelfName('📚📚📚') // "" (no usable characters)
 */
export function slugifyShelfName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics left by NFKD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '');
}

/**
 * Build the canonical URL segment for a shared shelf: "<slug>-<token>",
 * or just the token when the name yields no usable slug.
 */
export function buildShareSlug(name: string, shareToken: string): string {
  const slug = slugifyShelfName(name);
  return slug ? `${slug}-${shareToken}` : shareToken;
}

/** Canonical public path for a shared shelf. */
export function buildSharePath(name: string, shareToken: string): string {
  return `/s/${buildShareSlug(name, shareToken)}`;
}

/**
 * Extract the share token from a URL segment, with or without a slug prefix.
 *
 * @example
 * extractShareToken('my-favorite-books-Xk9mP2vL') // "Xk9mP2vL"
 * extractShareToken('Xk9mP2vL') // "Xk9mP2vL" (legacy slug-less URL)
 */
export function extractShareToken(param: string): string {
  let decoded = param;
  try {
    decoded = decodeURIComponent(param);
  } catch {
    // Malformed percent-encoding — fall through with the raw value
  }
  const lastHyphen = decoded.lastIndexOf('-');
  return lastHyphen === -1 ? decoded : decoded.slice(lastHyphen + 1);
}
