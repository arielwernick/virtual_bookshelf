import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getShelfById, updateShelf } from '@/lib/db/queries';

const MAX_DESCRIPTION_LENGTH = 500;

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
    const { shelf_id, description } = body;

    if (!shelf_id) {
      return NextResponse.json(
        { success: false, error: 'Shelf ID is required' },
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

    // Validate description length
    if (description && typeof description === 'string' && description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Update the shelf's description
    const updatedShelf = await updateShelf(shelf_id, { description: description || null });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedShelf.id,
        name: updatedShelf.name,
        description: updatedShelf.description,
      },
    });
  } catch (error) {
    console.error('Error updating shelf description:', error);
    return NextResponse.json({ success: false, error: 'Failed to update shelf description' }, { status: 500 });
  }
}
