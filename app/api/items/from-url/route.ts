import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { extractVideoId, getVideoDetails } from '@/lib/api/youtube';
import { fetchLinkMetadata, isYouTubeUrl, MicrolinkQuotaExceededError } from '@/lib/api/microlink';
import { sql } from '@/lib/db/client';
import { createItem } from '@/lib/db/queries';
import { createLogger } from '@/lib/utils/logger';
import { safeHttpUrl } from '@/lib/utils/validation';
import { revalidateSharedShelf } from '@/lib/utils/revalidateShelf';

const logger = createLogger('ItemsFromUrl');

export const runtime = 'edge';

/**
 * POST /api/items/from-url
 * Create an item from a URL (supports YouTube videos and generic links via Microlink)
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, shelf_id } = body;

    // Validate inputs
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!shelf_id || typeof shelf_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Shelf ID is required' },
        { status: 400 }
      );
    }

    // Verify shelf exists and belongs to user
    const shelfResult = await sql`
      SELECT id, share_token, name FROM shelves
      WHERE id = ${shelf_id}
      AND user_id = ${session.userId}
      LIMIT 1
    `;

    if (shelfResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Shelf not found' },
        { status: 404 }
      );
    }

    // Get the next order_index for this shelf
    const orderResult = await sql`
      SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
      FROM items
      WHERE shelf_id = ${shelf_id}
    `;
    const nextOrder = orderResult[0]?.next_order || 0;

    // Check if it's a YouTube URL - use existing YouTube handler
    if (isYouTubeUrl(url)) {
      const videoId = extractVideoId(url);
      
      if (!videoId) {
        return NextResponse.json(
          { success: false, error: 'Invalid YouTube URL. Please provide a valid YouTube video URL.' },
          { status: 400 }
        );
      }

      // Fetch video details from YouTube API
      let videoDetails;
      try {
        videoDetails = await getVideoDetails(videoId);
      } catch (error) {
        logger.errorWithException('YouTube API error', error);
        return NextResponse.json(
          { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch video details from YouTube' 
          },
          { status: 500 }
        );
      }

      // Create the video item. createItem applies the same rules as every
      // other add: only web URLs are stored and the identifier is recorded.
      const item = await createItem(
        shelf_id,
        {
          type: 'video',
          title: videoDetails.title,
          creator: videoDetails.channelName,
          image_url: videoDetails.thumbnailUrl,
          external_url: videoDetails.videoUrl,
          order_index: nextOrder,
        },
        session.userId
      );
      revalidateSharedShelf(shelfResult[0].share_token as string, shelfResult[0].name as string);

      return NextResponse.json({
        success: true,
        data: item,
      });
    }

    // For all other URLs, use Microlink to extract metadata
    let linkMetadata;
    try {
      linkMetadata = await fetchLinkMetadata(url);
    } catch (error) {
      logger.errorWithException('Microlink API error', error);
      
      // Return 503 for quota exceeded to signal UI to disable feature
      if (error instanceof MicrolinkQuotaExceededError) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'quota_exceeded',
            message: 'Link preview service temporarily unavailable'
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to fetch link metadata' 
        },
        { status: 500 }
      );
    }

    // The metadata service returns the page's own URL, which is not ours to
    // trust: only web URLs are stored (issue #296), falling back to what the
    // user pasted. createItem checks the image the same way.
    const item = await createItem(
      shelf_id,
      {
        type: 'link',
        title: linkMetadata.title,
        creator: linkMetadata.publisher,
        image_url: linkMetadata.image ?? undefined,
        external_url: safeHttpUrl(linkMetadata.url) ?? safeHttpUrl(url) ?? undefined,
        order_index: nextOrder,
      },
      session.userId
    );
    revalidateSharedShelf(shelfResult[0].share_token as string, shelfResult[0].name as string);

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    logger.errorWithException('Failed to create item from URL', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
