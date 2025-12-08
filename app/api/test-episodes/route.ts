import { NextResponse } from 'next/server';
import { getShowEpisodes } from '@/lib/api/spotify';

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

    console.log(`Testing getShowEpisodes with showId: ${showId}, offset: ${offset}, limit: ${limit}`);

    const result = await getShowEpisodes(showId, { offset, limit });

    console.log(`Successfully fetched ${result.episodes.length} episodes for show "${result.showName}"`);
    console.log('Sample episode data:', result.episodes[0]);

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
    console.error('Error testing getShowEpisodes:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}