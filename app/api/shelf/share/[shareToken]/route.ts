import { NextRequest, NextResponse } from 'next/server';
import { getShelfByShareToken, getItemsByShelfId } from '@/lib/db/queries';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ShelfShare');

/**
 * GET: Fetch a public shelf by share token
 * No authentication required - these are public shelves
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;

    // Get shelf by share token
    // Unpublished shelves 404 (matching /s/[shareToken] and the OG route)
    // rather than 403, so their existence isn't leaked
    const shelf = await getShelfByShareToken(shareToken);
    if (!shelf || !shelf.is_public) {
      return NextResponse.json(
        { success: false, error: 'Shelf not found' },
        { status: 404 }
      );
    }

    // Get shelf's items
    const items = await getItemsByShelfId(shelf.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: shelf.id,
          name: shelf.name,
          description: shelf.description,
          items,
          created_at: shelf.created_at,
        },
      },
      {
        headers: {
          // Public data: let the CDN serve embeds without hitting the
          // function/DB. Fresh for 60s, then served stale while revalidating.
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    logger.errorWithException('Failed to fetch shared shelf', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shelf' },
      { status: 500 }
    );
  }
}
