import { NextResponse } from 'next/server';
import { fetchLinkMetadata, MicrolinkQuotaExceededError, MicrolinkData } from '@/lib/api/microlink';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ImportMetadata');

const MAX_URLS = 20; // Lower limit for metadata fetch to respect Microlink quota
const CONCURRENCY_LIMIT = 3;

interface MetadataResult {
  url: string;
  metadata?: MicrolinkData;
  error?: string;
}

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
          results: [],
          quotaExceeded: false,
        },
      });
    }

    if (urls.length > MAX_URLS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_URLS} URLs allowed per request for metadata fetch` },
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

    logger.info(`Fetching metadata for ${urls.length} URLs`);

    const results: MetadataResult[] = [];
    let quotaExceeded = false;

    // Process URLs in batches to respect rate limits
    for (let i = 0; i < urls.length && !quotaExceeded; i += CONCURRENCY_LIMIT) {
      const batch = urls.slice(i, i + CONCURRENCY_LIMIT);
      
      const batchPromises = batch.map(async (url): Promise<MetadataResult> => {
        try {
          const metadata = await fetchLinkMetadata(url);
          return { url, metadata };
        } catch (error) {
          if (error instanceof MicrolinkQuotaExceededError) {
            quotaExceeded = true;
            return { url, error: 'Quota exceeded' };
          }
          logger.warn(`Failed to fetch metadata for ${url}:`, error instanceof Error ? error.message : error);
          return { url, error: error instanceof Error ? error.message : 'Failed to fetch metadata' };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // If quota was exceeded mid-batch, mark remaining URLs
    if (quotaExceeded) {
      const processedUrls = new Set(results.map((r) => r.url));
      for (const url of urls) {
        if (!processedUrls.has(url)) {
          results.push({ url, error: 'Quota exceeded - not processed' });
        }
      }
    }

    const successCount = results.filter((r) => r.metadata).length;
    const failedCount = results.filter((r) => r.error).length;

    logger.info(`Metadata fetch complete: ${successCount} success, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      data: {
        results,
        quotaExceeded,
        summary: {
          total: urls.length,
          success: successCount,
          failed: failedCount,
        },
      },
    });
  } catch (error) {
    logger.errorWithException('Failed to fetch metadata', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
