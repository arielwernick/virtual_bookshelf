/**
 * First-touch signup attribution.
 *
 * On a visitor's first page load the client stores where they came from
 * (external referrer + UTM params) in a first-party cookie. When they create
 * an account, the signup routes read that cookie and persist it on the user so
 * the admin dashboard can show which channels bring in real signups.
 *
 * This module is pure (no next/headers) so it can be imported client-side.
 */

import type { SignupAttribution } from '@/lib/types/shelf';

export const ATTRIBUTION_COOKIE = 'vb_attribution';
export const ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const MAX_REFERRER_LENGTH = 500;
const MAX_UTM_LENGTH = 100;
const MAX_LANDING_PATH_LENGTH = 200;

/**
 * Pages whose path holds a secret or a private id. Only the prefix is kept:
 * a share token is a link-only secret for shelves that are not public, and
 * attribution is stored on the user who signs up.
 */
const REDACTED_PATH_PREFIXES = ['/s/', '/embed/', '/shelf/', '/oauth/'];

/**
 * The path a visitor first landed on, without query string or fragment, with
 * secrets replaced by "*". Returns null for anything that is not a plain path.
 */
export function cleanLandingPath(path: unknown): string | null {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return null;
  let clean = path.split(/[?#]/)[0];
  try {
    clean = decodeURI(clean);
  } catch {
    // keep it encoded
  }
  if (/[\u0000-\u001f<>"]/.test(clean)) return null;

  const redacted = REDACTED_PATH_PREFIXES.find((prefix) => clean.startsWith(prefix));
  if (redacted) return `${redacted}*`;

  clean = clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
  return clean.slice(0, MAX_LANDING_PATH_LENGTH) || null;
}

/**
 * Compact cookie payload: r = referrer, us/um/uc = utm source/medium/campaign,
 * l = landing page path.
 */
interface AttributionCookiePayload {
  r?: string;
  l?: string;
  us?: string;
  um?: string;
  uc?: string;
}

/**
 * Reduce a referrer URL to origin + path, dropping query strings and
 * fragments (which can carry search terms or tokens). Returns null for
 * same-site or unparseable referrers.
 */
export function normalizeReferrer(referrer: string, currentHost?: string): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (currentHost && url.host === currentHost) return null;
    const path = url.pathname === '/' ? '' : url.pathname;
    return `${url.origin}${path}`.slice(0, MAX_REFERRER_LENGTH);
  } catch {
    return null;
  }
}

function cleanUtm(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase().slice(0, MAX_UTM_LENGTH);
  return trimmed || null;
}

/**
 * Build the cookie value for a first visit. Called client-side with
 * window.location.href and document.referrer.
 */
export function buildAttributionCookieValue(href: string, referrer: string): string {
  const url = new URL(href);
  const payload: AttributionCookiePayload = {};

  const r = normalizeReferrer(referrer, url.host);
  if (r) payload.r = r;

  const us = cleanUtm(url.searchParams.get('utm_source'));
  const um = cleanUtm(url.searchParams.get('utm_medium'));
  const uc = cleanUtm(url.searchParams.get('utm_campaign'));
  if (us) payload.us = us;
  if (um) payload.um = um;
  if (uc) payload.uc = uc;

  const l = cleanLandingPath(url.pathname);
  if (l) payload.l = l;

  return encodeURIComponent(JSON.stringify(payload));
}

/**
 * Parse the attribution cookie. The cookie is client-writable, so every field
 * is re-validated and truncated. Returns null when the cookie is missing or
 * malformed; an empty-but-valid cookie means a direct visit.
 */
export function parseAttributionCookie(raw: string | undefined): SignupAttribution | null {
  if (!raw) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;

  const p = payload as Record<string, unknown>;
  return {
    firstReferrer: typeof p.r === 'string' ? normalizeReferrer(p.r) : null,
    utmSource: cleanUtm(p.us),
    utmMedium: cleanUtm(p.um),
    utmCampaign: cleanUtm(p.uc),
    landingPath: cleanLandingPath(p.l),
  };
}

const SEARCH_ENGINES: Record<string, string> = {
  google: 'Google',
  bing: 'Bing',
  duckduckgo: 'DuckDuckGo',
  yahoo: 'Yahoo',
  ecosia: 'Ecosia',
  brave: 'Brave Search',
  kagi: 'Kagi',
};

const AI_ASSISTANTS: Record<string, string> = {
  'chatgpt.com': 'ChatGPT',
  'chat.openai.com': 'ChatGPT',
  'perplexity.ai': 'Perplexity',
  'claude.ai': 'Claude',
  'gemini.google.com': 'Gemini',
  'copilot.microsoft.com': 'Copilot',
};

const SOCIAL_HOSTS: Record<string, string> = {
  't.co': 'X / Twitter',
  'x.com': 'X / Twitter',
  'twitter.com': 'X / Twitter',
  'linkedin.com': 'LinkedIn',
  'lnkd.in': 'LinkedIn',
  'facebook.com': 'Facebook',
  'instagram.com': 'Instagram',
  'reddit.com': 'Reddit',
  'news.ycombinator.com': 'Hacker News',
  'threads.net': 'Threads',
  'bsky.app': 'Bluesky',
  'youtube.com': 'YouTube',
};

/**
 * The channel name for a utm_source that names a known site, such as
 * "chatgpt.com", "chatgpt", "perplexity" or "linkedin". Null otherwise.
 */
function knownSourceForUtm(utmSource: string): string | null {
  const value = stripWww(utmSource.trim().toLowerCase());
  const candidates = [value, `${value}.com`, `${value}.ai`];

  for (const candidate of candidates) {
    if (AI_ASSISTANTS[candidate]) return AI_ASSISTANTS[candidate];
    if (SOCIAL_HOSTS[candidate]) return SOCIAL_HOSTS[candidate];
  }
  const bare = value.replace(/\.(com|ai|org|net)$/, '');
  if (bare === 'chatgpt' || bare === 'openai') return 'ChatGPT';
  if (SEARCH_ENGINES[bare]) return SEARCH_ENGINES[bare];
  return null;
}

function stripWww(host: string): string {
  return host.replace(/^(www|m|l|lm)\./, '');
}

/**
 * Map raw attribution to a human-readable channel for the admin dashboard.
 */
export function classifyAttribution(
  firstReferrer: string | null,
  utmSource: string | null,
  tracked: boolean = true,
): string {
  if (!tracked) return 'Before tracking';
  if (utmSource) {
    // Some sites tag their outbound links with their own name: ChatGPT adds
    // utm_source=chatgpt.com to every link it cites. Those are the same
    // channel as a referrer from that site, so they get the same label.
    // Only tags nobody else would set (our own, a newsletter) are campaigns.
    return knownSourceForUtm(utmSource) ?? `Campaign: ${utmSource}`;
  }
  if (!firstReferrer) return 'Direct';

  let host: string;
  try {
    host = stripWww(new URL(firstReferrer).hostname);
  } catch {
    return 'Direct';
  }

  if (AI_ASSISTANTS[host]) return AI_ASSISTANTS[host];
  if (SOCIAL_HOSTS[host]) return SOCIAL_HOSTS[host];

  const engine = Object.keys(SEARCH_ENGINES).find(
    (name) => host === `${name}.com` || host.startsWith(`${name}.`) || host.includes(`.${name}.`)
  );
  if (engine) return SEARCH_ENGINES[engine];

  return host;
}
