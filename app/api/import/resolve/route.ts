import { NextResponse } from 'next/server';
import { resolveUrls } from '@/lib/utils/urlResolver';
import { getSession } from '@/lib/utils/session';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ImportResolve');

const MAX_URLS = 50;
const CONCURRENCY_LIMIT = 3; // Reduced to avoid rate limiting
const TIMEOUT_MS = 8000; // Increased timeout for slow redirects

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls } = body;

    // Validate urls input
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { success: false, error: 'URLs array is required' },
        { status: 400 }
      );
    }

    if (urls.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          resolved: {},
          failed: [],
        },
      });
    }

    if (urls.length > MAX_URLS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_URLS} URLs allowed per request` },
        { status: 400 }
      );
    }

    // Validate each URL is a string
    if (!urls.every((url): url is string => typeof url === 'string')) {
      return NextResponse.json(
        { success: false, error: 'All URLs must be strings' },
        { status: 400 }
      );
    }

    // Check if user is authenticated (for logging purposes)
    const session = await getSession();
    const isAuthenticated = !!session;

    logger.info(`Resolving ${urls.length} URLs (authenticated: ${isAuthenticated})`);

    // Resolve shortened URLs
    const result = await resolveUrls(urls, CONCURRENCY_LIMIT, TIMEOUT_MS);

    logger.info(`Resolved URLs: ${Object.keys(result.resolved).length} success, ${result.failed.length} failed`);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.errorWithException('Failed to resolve URLs', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resolve URLs' },
      { status: 500 }
    );
  }
}
