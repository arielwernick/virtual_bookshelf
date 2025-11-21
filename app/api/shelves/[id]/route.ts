import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getShelfById, updateShelf, deleteShelf } from '@/lib/db/queries';

/**
 * GET /api/shelves/[id] - Get a specific shelf
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const shelf = await getShelfById(id);

    if (!shelf) {
      return NextResponse.json(
        { success: false, error: 'Shelf not found' },
        { status: 404 }
      );
    }

    // Verify the shelf belongs to the authenticated user
    if (shelf.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shelf,
    });
  } catch (error) {
    console.error('Error fetching shelf:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shelf' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/shelves/[id] - Update a shelf
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const shelf = await getShelfById(id);

    if (!shelf) {
      return NextResponse.json(
        { success: false, error: 'Shelf not found' },
        { status: 404 }
      );
    }

    // Verify the shelf belongs to the authenticated user
    if (shelf.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Shelf name cannot be empty' },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { success: false, error: 'Shelf name must be 100 characters or less' },
          { status: 400 }
        );
      }
    }

    const updatedShelf = await updateShelf(id, {
      name: name !== undefined ? name.trim() : undefined,
      description: description !== undefined ? description : undefined,
    });

    return NextResponse.json({
      success: true,
      data: updatedShelf,
    });
  } catch (error: any) {
    console.error('Error updating shelf:', error);

    // Handle unique constraint violation (duplicate name)
    if (error?.message?.includes('shelves_user_name_unique')) {
      return NextResponse.json(
        { success: false, error: 'You already have a shelf with this name' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update shelf' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shelves/[id] - Delete a shelf
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const shelf = await getShelfById(id);

    if (!shelf) {
      return NextResponse.json(
        { success: false, error: 'Shelf not found' },
        { status: 404 }
      );
    }

    // Verify the shelf belongs to the authenticated user
    if (shelf.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Prevent deletion of default shelf
    if (shelf.is_default) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your default shelf' },
        { status: 400 }
      );
    }

    await deleteShelf(id);

    return NextResponse.json({
      success: true,
      message: 'Shelf deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting shelf:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete shelf' },
      { status: 500 }
    );
  }
}
