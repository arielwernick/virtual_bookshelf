import { NextResponse } from 'next/server';
import { getBookDetails } from '@/lib/api/bookDetails';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit, getClientIP, getExternalApiRateLimiter, isRateLimitingEnabled } from '@/lib/utils/rateLimit';

const logger = createLogger('BookDetails');

/** Public book facts change rarely: let the CDN serve repeats for a day. */
const CACHE_HEADER = 'public, s-maxage=86400, stale-while-revalidate=604800';

/**
 * GET /api/books/details?googleId=…&openLibraryId=…&title=…&author=…
 *
 * Public, like the shelves that call it: details are the same for everyone
 * and come from public catalogues. Title is required as the fallback lookup.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title')?.trim().slice(0, 300);

    if (!title) {
      return NextResponse.json({ success: false, error: 'Query parameter "title" is required' }, { status: 400 });
    }

    if (isRateLimitingEnabled()) {
      const limited = await checkRateLimit(getExternalApiRateLimiter(), getClientIP(request));
      if (!limited.success) return limited.response;
    }

    const details = await getBookDetails({
      title,
      author: searchParams.get('author')?.trim().slice(0, 300) || null,
      googleVolumeId: searchParams.get('googleId'),
      openLibraryId: searchParams.get('openLibraryId'),
    });

    return NextResponse.json({ success: true, data: details }, { headers: { 'Cache-Control': CACHE_HEADER } });
  } catch (error) {
    logger.errorWithException('Failed to load book details', error);
    return NextResponse.json({ success: false, error: 'Failed to load book details' }, { status: 500 });
  }
}
