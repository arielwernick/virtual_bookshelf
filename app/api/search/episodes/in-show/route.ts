import { NextRequest, NextResponse } from 'next/server';
import { searchEpisodesInShow } from '@/lib/api/spotify';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showId = searchParams.get('showId');
    const query = searchParams.get('q');
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!showId) {
      return NextResponse.json(
        { success: false, error: 'Show ID is required' },
        { status: 400 }
      );
    }

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const result = await searchEpisodesInShow(showId, query.trim(), offset, limit);

    return NextResponse.json({
      success: true,
      data: {
        episodes: result.episodes,
        total: result.total,
        hasMore: offset + limit < result.total,
      },
    });
  } catch (error) {
    console.error('Episode search error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Show not found')) {
        return NextResponse.json(
          { success: false, error: 'Podcast show not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('Spotify credentials')) {
        return NextResponse.json(
          { success: false, error: 'Spotify service unavailable' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to search episodes' },
      { status: 500 }
    );
  }
}