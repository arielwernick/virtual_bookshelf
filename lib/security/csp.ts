/**
 * Content Security Policy for the main site (issue #82).
 *
 * Sent as Content-Security-Policy-Report-Only for now: the browser reports
 * what the policy would block (in its console) and blocks nothing. That makes
 * it safe to ship and tune. Switch to the enforcing header only after the
 * preview has been used for a while with a clean console.
 *
 * Kept in its own file so the policy can be read and tested without loading
 * the whole Next.js config.
 */

const DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  // Next.js inlines small bootstrap scripts; Vercel Analytics loads its own.
  'script-src': ["'self'", "'unsafe-inline'", 'https://va.vercel-scripts.com'],
  // Tailwind and next/font inject style tags.
  'style-src': ["'self'", "'unsafe-inline'"],
  // Covers come from whatever site an item links to, so any https image.
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://va.vercel-scripts.com', 'https://vitals.vercel-insights.com'],
  // Players shown inside item windows and on /v/ watch pages.
  'frame-src': [
    "'self'",
    // The homepage demo frames a live embed from the production site
    'https://virtualbookshelf.app',
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
    'https://open.spotify.com',
  ],
  // The main site is never framed. /embed/ has its own header.
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'", 'https://accounts.google.com'],
  'object-src': ["'none'"],
};

export const CSP_REPORT_ONLY_HEADER = 'Content-Security-Policy-Report-Only';

export function buildContentSecurityPolicy(): string {
  return Object.entries(DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}
