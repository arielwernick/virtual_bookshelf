import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getShelfsByUserId, getItemsByShelfId } from '@/lib/db/queries';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ShelfDashboard');

/**
 * Get user's dashboard data (all shelves with item counts)
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

    // Get all shelves for user
    const shelves = await getShelfsByUserId(session.userId);

    // Get item count for each shelf
    const shelvesWithCounts = await Promise.all(
      shelves.map(async (shelf) => {
        const items = await getItemsByShelfId(shelf.id);
        return {
          id: shelf.id,
          name: shelf.name,
          description: shelf.description,
          share_token: shelf.share_token,
          is_public: shelf.is_public,
          item_count: items.length,
          created_at: shelf.created_at,
          updated_at: shelf.updated_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        user_id: session.userId,
        username: session.username,
        email: session.email,
        shelves: shelvesWithCounts,
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
