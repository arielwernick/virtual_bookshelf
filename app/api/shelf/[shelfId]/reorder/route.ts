import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getShelfById, getItemsByShelfId, updateItemOrder } from '@/lib/db/queries';
import { isTop5Shelf } from '@/lib/utils/top5';

interface RouteParams {
  params: Promise<{ shelfId: string }>;
}

/**
 * Reorder items in a shelf (primarily for Top 5 shelves)
 * Request body: { item_ids: string[] } - array of item IDs in desired order
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { shelfId } = await params;

    // Check authentication
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify shelf exists and user owns it
    const shelf = await getShelfById(shelfId);
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

    const body = await request.json();
    const { item_ids } = body;

    // Validate item_ids
    if (!Array.isArray(item_ids)) {
      return NextResponse.json(
        { success: false, error: 'item_ids must be an array' },
        { status: 400 }
      );
    }

    if (item_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'item_ids cannot be empty' },
        { status: 400 }
      );
    }

    // Verify all item_ids are strings
    if (!item_ids.every((id) => typeof id === 'string')) {
      return NextResponse.json(
        { success: false, error: 'All item_ids must be strings' },
        { status: 400 }
      );
    }

    // Get existing items and verify all provided IDs belong to this shelf
    const existingItems = await getItemsByShelfId(shelfId);
    const existingItemIds = new Set(existingItems.map((item) => item.id));

    for (const id of item_ids) {
      if (!existingItemIds.has(id)) {
        return NextResponse.json(
          { success: false, error: `Item ${id} does not belong to this shelf` },
          { status: 400 }
        );
      }
    }

    // Check for duplicates in item_ids
    const uniqueIds = new Set(item_ids);
    if (uniqueIds.size !== item_ids.length) {
      return NextResponse.json(
        { success: false, error: 'Duplicate item IDs not allowed' },
        { status: 400 }
      );
    }

    // For Top 5 shelves, ensure all items are included
    if (isTop5Shelf(shelf)) {
      if (item_ids.length !== existingItems.length) {
        return NextResponse.json(
          { success: false, error: 'All items must be included when reordering a Top 5 shelf' },
          { status: 400 }
        );
      }
    }

    // Update item order
    await updateItemOrder(shelfId, item_ids);

    // Fetch updated items
    const updatedItems = await getItemsByShelfId(shelfId);

    return NextResponse.json({
      success: true,
      data: {
        items: updatedItems,
      },
    });
  } catch (error) {
    console.error('Error reordering items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder items' },
      { status: 500 }
    );
  }
}
