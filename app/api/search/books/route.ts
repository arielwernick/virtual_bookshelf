import { NextResponse } from 'next/server';
import { searchBooks } from '@/lib/api/googleBooks';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SearchBooks');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const results = await searchBooks(query);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.errorWithException('Failed to search books', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search books' },
      { status: 500 }
    );
  }
}
