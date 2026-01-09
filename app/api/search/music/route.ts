import { NextResponse } from 'next/server';
import { searchMusic } from '@/lib/api/spotify';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SearchMusic');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const typeParam = searchParams.get('type');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const type = (typeParam === 'podcast' ? 'podcast' : 'music') as 'music' | 'podcast';
    const results = await searchMusic(query, type);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.errorWithException('Failed to search music/podcasts', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search music/podcasts' },
      { status: 500 }
    );
  }
}
