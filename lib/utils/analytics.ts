import { track } from '@vercel/analytics/server';
import { createLogger } from './logger';

const logger = createLogger('Analytics');

type EventProperties = Record<string, string | number | boolean | null>;

/**
 * Fire a Vercel Analytics custom event from a server route handler.
 *
 * Non-fatal by design: any analytics failure is logged and swallowed so it can
 * never break the request flow (e.g. account creation must still succeed even
 * if tracking the event fails). Passing the originating `request` lets Vercel
 * attribute the event correctly (geo, path, etc.).
 *
 * Custom events appear under Analytics → Events in the Vercel dashboard.
 */
export async function trackServerEvent(
  name: string,
  properties: EventProperties,
  request?: Request,
): Promise<void> {
  try {
    await track(name, properties, request ? { headers: request.headers } : undefined);
  } catch (error) {
    logger.warn('Failed to track analytics event', {
      event: name,
      error: error instanceof Error ? error.message : 'unknown',
    });
  }
}
