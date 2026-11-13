import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getShelvesForDashboard, getShelfViewsForOwner, touchUserLastSeen } from '@/lib/db/queries';
import type { ShelfViewSummary } from '@/lib/types/shelf';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ShelfDashboard');

/**
 * Get user's dashboard data (all shelves with item counts and preview items)
 * Requires: user must be logged in with valid session
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  try {
    // Check for valid session
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - please log in first' },
        { status: 401 }
      );
    }

    // Single query: all shelves with total counts + preview items.
    // Activity tracking runs alongside and must never fail the dashboard.
    const [shelves, views] = await Promise.all([
      getShelvesForDashboard(session.userId),
      // View counts are a nice-to-have: the dashboard still loads without them
      getShelfViewsForOwner(session.userId).catch((error) => {
        logger.errorWithException('Failed to load shelf view counts', error);
        return new Map<string, ShelfViewSummary>();
      }),
      touchUserLastSeen(session.userId).catch((error) =>
        logger.errorWithException('Failed to update last_seen_at', error)
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        user_id: session.userId,
        username: session.username,
        email: session.email,
        shelves: shelves.map((shelf) => ({
          id: shelf.id,
          name: shelf.name,
          description: shelf.description,
          share_token: shelf.share_token,
          is_public: shelf.is_public,
          item_count: shelf.item_count,
          preview_items: shelf.preview_items,
          views: views.get(shelf.id),
          created_at: shelf.created_at,
          updated_at: shelf.updated_at,
        })),
      },
    });
  } catch (error) {
    logger.errorWithException('Failed to fetch dashboard', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
