import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { extractVideoId, getVideoDetails } from '@/lib/api/youtube';
import { sql } from '@/lib/db/client';

export const runtime = 'edge';

/**
 * POST /api/items/from-url
 * Create an item from a URL (currently supports YouTube videos)
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

    // Try to extract YouTube video ID
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
      console.error('YouTube API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to fetch video details from YouTube' 
        },
        { status: 500 }
      );
    }

    // Get the next order_index for this shelf
    const orderResult = await sql`
      SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
      FROM items
      WHERE shelf_id = ${shelf_id}
    `;
    const nextOrder = orderResult[0]?.next_order || 0;

    // Create the item
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
  } catch (error) {
    console.error('Error creating item from URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
