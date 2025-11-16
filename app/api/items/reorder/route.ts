import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { updateItemOrder } from '@/lib/db/queries';

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
    const { itemIds } = body;

    if (!Array.isArray(itemIds)) {
      return NextResponse.json(
        { success: false, error: 'itemIds must be an array' },
        { status: 400 }
      );
    }

    // Update item order
    await updateItemOrder(session.userId, itemIds);

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
