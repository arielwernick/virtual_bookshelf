import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { updateItemOrder, getShelfById } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shelf_id, itemIds } = body;

    if (!shelf_id) {
      return NextResponse.json(
        { success: false, error: 'Shelf ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(itemIds)) {
      return NextResponse.json(
        { success: false, error: 'itemIds must be an array' },
        { status: 400 }
      );
    }

    // Verify shelf ownership
    const shelf = await getShelfById(shelf_id);
    if (!shelf || shelf.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update item order
    await updateItemOrder(shelf_id, itemIds);

    return NextResponse.json({
      success: true,
      message: 'Items reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder items' },
      { status: 500 }
    );
  }
}
