import { NextRequest, NextResponse } from 'next/server';
import { loadPublicShelf, PUBLIC_SHELF_CACHE_CONTROL } from '@/lib/shelf/loadPublicShelf';
import { buildShelfUrls, getBaseUrl } from '@/lib/shelf/publicShelf';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('OEmbed');

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 600;
const MIN_SIZE = 200;
const MAX_SIZE = 1200;

function clampSize(raw: string | null, fallback: number): number {
  const value = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, MIN_SIZE), MAX_SIZE);
}

function escapeAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Pull the shelf segment out of a shelf URL on this site. Returns null for
 * anything else, so the endpoint can't be used to describe other sites.
 */
export function shelfParamFromUrl(rawUrl: string, allowedHosts: string[]): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!allowedHosts.includes(url.host)) return null;

  const match = url.pathname.match(/^\/(?:s|embed)\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/**
 * GET /oembed?url=<shelf url>&format=json&maxwidth=&maxheight=
 *
 * oEmbed 1.0 provider (https://oembed.com, issue #286). Editors that support
 * oEmbed discover this endpoint from the <link> tag on a shelf page and swap
 * a pasted shelf link for the embed. Public shelves only.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const format = searchParams.get('format') ?? 'json';
  if (format !== 'json') {
    // The spec's answer for a format the provider doesn't offer
    return jsonError('Only format=json is supported', 501);
  }

  const rawUrl = searchParams.get('url');
  if (!rawUrl) return jsonError('Missing url parameter', 400);

  const baseUrl = getBaseUrl();
  const param = shelfParamFromUrl(rawUrl, [new URL(baseUrl).host, request.nextUrl.host]);
  if (!param) return jsonError('Not a shelf URL on this site', 404);

  try {
    const loaded = await loadPublicShelf(param);
    if (!loaded) return jsonError('Shelf not found', 404);

    const { shelf } = loaded;
    const width = clampSize(searchParams.get('maxwidth'), DEFAULT_WIDTH);
    const height = clampSize(searchParams.get('maxheight'), DEFAULT_HEIGHT);
    const embedUrl = `${baseUrl}/embed/${encodeURIComponent(shelf.share_token)}`;
    const title = escapeAttribute(shelf.name);

    return NextResponse.json(
      {
        version: '1.0',
        type: 'rich',
        title: shelf.name,
        provider_name: 'Virtual Bookshelf',
        provider_url: baseUrl,
        url: buildShelfUrls(shelf.name, shelf.share_token, baseUrl).html,
        html: `<iframe src="${embedUrl}" width="${width}" height="${height}" style="border:none;border-radius:8px;max-width:100%;" title="${title}" loading="lazy"></iframe>`,
        width,
        height,
        thumbnail_url: `${baseUrl}/api/og/${encodeURIComponent(shelf.share_token)}`,
        thumbnail_width: 1200,
        thumbnail_height: 630,
        cache_age: 300,
      },
      {
        headers: {
          'Cache-Control': PUBLIC_SHELF_CACHE_CONTROL,
          'X-Robots-Tag': 'noindex',
        },
      }
    );
  } catch (error) {
    logger.errorWithException('oEmbed lookup failed', error);
    return jsonError('Failed to load shelf', 500);
  }
}
