import { NextResponse } from 'next/server';
import { getShowEpisodes } from '@/lib/api/spotify';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('TestEpisodes');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showId = searchParams.get('showId');
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!showId) {
      return NextResponse.json(
        { success: false, error: 'showId parameter is required' },
        { status: 400 }
      );
    }

    logger.debug('Testing getShowEpisodes', { showId, offset, limit });

    const result = await getShowEpisodes(showId, { offset, limit });

    logger.debug('Successfully fetched episodes', { 
      count: result.episodes.length, 
      showName: result.showName 
    });

    return NextResponse.json({
      success: true,
      data: {
        showName: result.showName,
        total: result.total,
        episodeCount: result.episodes.length,
        episodes: result.episodes.slice(0, 3), // Return first 3 episodes for testing
      },
    });
  } catch (error) {
    logger.errorWithException('Failed to test getShowEpisodes', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}