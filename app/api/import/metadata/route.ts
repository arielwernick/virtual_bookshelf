import { NextResponse } from 'next/server';
import { fetchLinkMetadata, MicrolinkQuotaExceededError, MicrolinkData, isYouTubeUrl } from '@/lib/api/microlink';
import { extractVideoId, getVideoDetails } from '@/lib/api/youtube';
import { getShow } from '@/lib/api/spotify';
import { getGoogleBooksCoverUrl, getSpotifyShowId } from '@/lib/utils/importLinks';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ImportMetadata');

const MAX_URLS = 20; // Lower limit for metadata fetch to respect Microlink quota
const CONCURRENCY_LIMIT = 3;

interface MetadataResult {
  url: string;
  metadata?: MicrolinkData;
  error?: string;
  source?: 'youtube' | 'spotify' | 'microlink';
}

/**
 * Fetch metadata for a Spotify show from the Spotify API. Microlink reads the
 * show page as its latest episode (that episode's title and art), so shows
 * need the API to come out right.
 */
async function fetchSpotifyShowMetadata(url: string): Promise<MicrolinkData | null> {
  const showId = getSpotifyShowId(url);
  if (!showId) return null;

  try {
    const show = await getShow(showId);
    if (!show) return null;
    return {
      title: show.title,
      description: `Podcast by ${show.creator}`,
      image: show.imageUrl || null,
      url: show.externalUrl,
      publisher: show.creator,
    };
  } catch (error) {
    logger.warn('Spotify API failed, will fall back to Microlink', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Fetch metadata for a YouTube URL using the YouTube Data API
 */
async function fetchYouTubeMetadata(url: string): Promise<MicrolinkData | null> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    logger.warn('Could not extract YouTube video ID', { url });
    return null;
  }

  try {
    const video = await getVideoDetails(videoId);
    return {
      title: video.title,
      description: `Video by ${video.channelName}`,
      image: video.thumbnailUrl,
      url: video.videoUrl,
      publisher: video.channelName,
    };
  } catch (error) {
    logger.warn('YouTube API failed, will fall back to Microlink', { 
      url, 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
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
          // Use YouTube API for YouTube URLs (better data, saves Microlink quota)
          if (isYouTubeUrl(url)) {
            const ytMetadata = await fetchYouTubeMetadata(url);
            if (ytMetadata) {
              return { url, metadata: ytMetadata, source: 'youtube' };
            }
            // Fall through to Microlink if YouTube API fails
          }

          if (getSpotifyShowId(url)) {
            const showMetadata = await fetchSpotifyShowMetadata(url);
            if (showMetadata) {
              return { url, metadata: showMetadata, source: 'spotify' };
            }
            // Fall through to Microlink if the Spotify API fails
          }

          const metadata = await fetchLinkMetadata(url);
          if (!metadata.image) {
            const cover = getGoogleBooksCoverUrl(url);
            if (cover) metadata.image = cover;
          }
          return { url, metadata, source: 'microlink' };
        } catch (error) {
          if (error instanceof MicrolinkQuotaExceededError) {
            quotaExceeded = true;
            return { url, error: 'Quota exceeded' };
          }
          logger.warn(`Failed to fetch metadata for ${url}:`, { 
            error: error instanceof Error ? error.message : String(error) 
          });
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
