import { NextResponse } from 'next/server';
import { searchEpisodes } from '@/lib/api/spotify';

/**
 * GET /api/search/episodes/search
 * 
 * Searches for podcast episodes by name across all podcasts on Spotify
 * 
 * Query Parameters:
 * - q: Required. The search query string
 * - offset: Optional. Number of episodes to skip (default: 0)
 * - limit: Optional. Number of episodes to return (default: 20, max: 50)
 * 
 * Returns:
 * - success: boolean
 * - data: { episodes: Episode[], total: number }
 * - error: string (if success is false)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const offsetParam = searchParams.get('offset');
    const limitParam = searchParams.get('limit');

    // Validate required parameters
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "q" is required and cannot be empty' },
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

    // Search episodes from Spotify
    const result = await searchEpisodes(query.trim(), { offset, limit });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error searching podcast episodes:', error);
    
    // Handle specific Spotify API errors
    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        return NextResponse.json(
          { success: false, error: 'Spotify service unavailable' },
          { status: 503 }
        );
      }
      
      if (error.message.includes('No episodes found')) {
        return NextResponse.json({
          success: true,
          data: { episodes: [], total: 0 },
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to search podcast episodes' },
      { status: 500 }
    );
  }
}