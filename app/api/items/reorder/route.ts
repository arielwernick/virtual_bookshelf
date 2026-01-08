import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { updateItemOrder, getShelfById, getItemById } from '@/lib/db/queries';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ItemsReorder');

/**
 * Reorder items within a shelf
 * Requires: user must own the shelf
 * Request body: { shelf_id: string, item_ids: [string, ...] }
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shelf_id, item_ids } = body;

    // Validate inputs
    if (!shelf_id || typeof shelf_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Shelf ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(item_ids)) {
      return NextResponse.json(
        { success: false, error: 'item_ids must be an array' },
        { status: 400 }
      );
    }

    // Verify shelf exists and user owns it
    const shelf = await getShelfById(shelf_id);
    if (!shelf) {
      return NextResponse.json(
        { success: false, error: 'Shelf not found' },
        { status: 404 }
      );
    }

    if (shelf.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - shelf does not belong to you' },
        { status: 403 }
      );
    }

    // Verify all items belong to this shelf
    for (const itemId of item_ids) {
      const item = await getItemById(itemId);
      if (!item || item.shelf_id !== shelf_id) {
        return NextResponse.json(
          { success: false, error: `Item ${itemId} does not belong to this shelf` },
          { status: 403 }
        );
      }
    }

    // Update item order
    await updateItemOrder(shelf_id, item_ids);

    return NextResponse.json({
      success: true,
      message: 'Items reordered successfully',
    });
  } catch (error) {
    logger.errorWithException('Failed to reorder items', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder items' },
      { status: 500 }
    );
  }
}
