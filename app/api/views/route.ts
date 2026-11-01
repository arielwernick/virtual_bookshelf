import { getShelfByShareToken, recordShelfView } from '@/lib/db/queries';
import { getSession } from '@/lib/utils/session';
import {
  getViewRateLimiter,
  getClientIP,
  checkRateLimit,
  isRateLimitingEnabled,
} from '@/lib/utils/rateLimit';
import { createLogger } from '@/lib/utils/logger';
import type { ViewSurface } from '@/lib/types/shelf';

const logger = createLogger('ShelfViews');

const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9-]{1,128}$/;
const HOSTNAME_PATTERN = /^[a-z0-9.-]{1,255}$/;
const SURFACES: readonly ViewSurface[] = ['shelf', 'embed'];

// Crawlers, link unfurlers and headless browsers that run JS and would
// otherwise fire the beacon.
const BOT_USER_AGENT =
  /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|quora link|whatsapp|bitlybot|vkshare|pinterest|google-inspectiontool|chrome-lighthouse|phantomjs|puppeteer|playwright/i;

/**
 * Every response is an empty 204, so the endpoint never reveals whether a
 * token exists, is private, or was counted.
 */
function noContent() {
  return new Response(null, { status: 204 });
}

function isBotUserAgent(userAgent: string | null): boolean {
  return !userAgent || BOT_USER_AGENT.test(userAgent);
}

/** Lowercased host name, or '' if the value isn't a plausible host. */
function normalizeEmbedHost(value: unknown): string {
  if (typeof value !== 'string') return '';
  const host = value.trim().toLowerCase();
  return HOSTNAME_PATTERN.test(host) ? host : '';
}

/**
 * POST: Count one view of a public shelf or embed.
 * No authentication required. Called by <ViewBeacon> via navigator.sendBeacon.
 */
export async function POST(request: Request) {
  try {
    let body: { shareToken?: unknown; surface?: unknown; embedHost?: unknown };
    try {
      // sendBeacon may send the JSON with a text/plain content type
      body = JSON.parse(await request.text());
    } catch {
      return noContent();
    }

    const { shareToken, surface } = body;
    if (typeof shareToken !== 'string' || !SHARE_TOKEN_PATTERN.test(shareToken)) {
      return noContent();
    }
    if (!SURFACES.includes(surface as ViewSurface)) {
      return noContent();
    }

    if (isBotUserAgent(request.headers.get('user-agent'))) {
      return noContent();
    }

    if (isRateLimitingEnabled()) {
      const rateLimitResult = await checkRateLimit(getViewRateLimiter(), getClientIP(request));
      if (!rateLimitResult.success) {
        return noContent();
      }
    }

    // Only logged-in visitors can be the owner, so anonymous views skip the
    // lookup; recordShelfView itself ignores private and unknown shelves.
    const session = await getSession();
    if (session?.userId) {
      const shelf = await getShelfByShareToken(shareToken);
      if (!shelf || !shelf.is_public || shelf.user_id === session.userId) {
        return noContent();
      }
    }

    const embedHost = surface === 'embed' ? normalizeEmbedHost(body.embedHost) : '';
    await recordShelfView(shareToken, surface as ViewSurface, embedHost);

    return noContent();
  } catch (error) {
    logger.errorWithException('Failed to record shelf view', error);
    return noContent();
  }
}
