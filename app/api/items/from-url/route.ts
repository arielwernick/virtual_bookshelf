import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { extractVideoId, extractChannelIdentifier, getVideoDetails, getChannelDetails } from '@/lib/api/youtube';
import { fetchLinkMetadata, isYouTubeUrl, MicrolinkQuotaExceededError } from '@/lib/api/microlink';
import { sql } from '@/lib/db/client';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ItemsFromUrl');

export const runtime = 'edge';

/**
 * POST /api/items/from-url
 * Create an item from a URL (supports YouTube videos, YouTube channels, and generic links via Microlink)
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
      SELECT id FROM shelves
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
      // Try to extract video ID first
      const videoId = extractVideoId(url);
      
      if (videoId) {
        // It's a video URL
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

        // Create the video item
        const result = await sql`
          INSERT INTO items (
            shelf_id,
            user_id,
            type,
            title,
            creator,
            image_url,
            external_url,
            order_index
          )
          VALUES (
            ${shelf_id},
            ${session.userId},
            'video',
            ${videoDetails.title},
            ${videoDetails.channelName},
            ${videoDetails.thumbnailUrl},
            ${videoDetails.videoUrl},
            ${nextOrder}
          )
          RETURNING *
        `;

        return NextResponse.json({
          success: true,
          data: result[0],
        });
      }
      
      // Try to extract channel identifier
      const channelIdentifier = extractChannelIdentifier(url);
      
      if (channelIdentifier) {
        // It's a channel URL
        let channelDetails;
        try {
          channelDetails = await getChannelDetails(channelIdentifier);
        } catch (error) {
          logger.errorWithException('YouTube channel API error', error);
          return NextResponse.json(
            { 
              success: false, 
              error: error instanceof Error ? error.message : 'Failed to fetch channel details from YouTube' 
            },
            { status: 500 }
          );
        }

        // Create the channel item as 'podcast' type
        // Using 'podcast' as the default type for YouTube channels
        const result = await sql`
          INSERT INTO items (
            shelf_id,
            user_id,
            type,
            title,
            creator,
            image_url,
            external_url,
            order_index
          )
          VALUES (
            ${shelf_id},
            ${session.userId},
            'podcast',
            ${channelDetails.title},
            ${channelDetails.handle || 'YouTube Channel'},
            ${channelDetails.thumbnailUrl},
            ${channelDetails.channelUrl},
            ${nextOrder}
          )
          RETURNING *
        `;

        return NextResponse.json({
          success: true,
          data: result[0],
        });
      }
      
      // Neither video nor channel URL
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL. Please provide a valid YouTube video or channel URL.' },
        { status: 400 }
      );
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

    // Create the link item
    const result = await sql`
      INSERT INTO items (
        shelf_id,
        user_id,
        type,
        title,
        creator,
        image_url,
        external_url,
        order_index
      )
      VALUES (
        ${shelf_id},
        ${session.userId},
        'link',
        ${linkMetadata.title},
        ${linkMetadata.publisher},
        ${linkMetadata.image},
        ${linkMetadata.url},
        ${nextOrder}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    logger.errorWithException('Failed to create item from URL', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
