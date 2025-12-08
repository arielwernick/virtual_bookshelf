import { NextResponse } from 'next/server';
import { getShowEpisodes } from '@/lib/api/spotify';

/**
 * GET /api/search/episodes
 * 
 * Fetches episodes for a specific podcast show from Spotify
 * 
 * Query Parameters:
 * - showId: Required. The Spotify show ID
 * - offset: Optional. Number of episodes to skip (default: 0)
 * - limit: Optional. Number of episodes to return (default: 20, max: 50)
 * 
 * Returns:
 * - success: boolean
 * - data: { episodes: Episode[], total: number, showName: string }
 * - error: string (if success is false)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showId = searchParams.get('showId');
    const offsetParam = searchParams.get('offset');
    const limitParam = searchParams.get('limit');

    // Validate required parameters
    if (!showId) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "showId" is required' },
        { status: 400 }
      );
    }

    // Parse and validate pagination parameters
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { success: false, error: 'Parameter "offset" must be a non-negative integer' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { success: false, error: 'Parameter "limit" must be an integer between 1 and 50' },
        { status: 400 }
      );
    }

    // Fetch episodes from Spotify
    const result = await getShowEpisodes(showId, { offset, limit });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching podcast episodes:', error);
    
    // Handle specific Spotify API errors
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch show information')) {
        return NextResponse.json(
          { success: false, error: 'Podcast show not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Failed to fetch episodes')) {
        return NextResponse.json(
          { success: false, error: 'Episodes not available for this show' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('credentials')) {
        return NextResponse.json(
          { success: false, error: 'Spotify service unavailable' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch podcast episodes' },
      { status: 500 }
    );
  }
}