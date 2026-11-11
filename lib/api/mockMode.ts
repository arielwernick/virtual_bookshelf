/**
 * Mock mode for outside APIs (issue #275).
 *
 * Adding an item calls Google Books, Spotify, YouTube or Microlink. Tests and
 * agents have no keys for those and must not spend real quota, so with
 * EXTERNAL_APIS=mock every client returns small fixed results instead and
 * makes no network request.
 *
 * It can never turn on in production: a stray variable there would show
 * every visitor the same two fake books.
 */
export function isMockMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.EXTERNAL_APIS === 'mock' && env.VERCEL_ENV !== 'production';
}
