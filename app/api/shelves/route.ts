import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getShelvesByUserId, createShelf } from '@/lib/db/queries';

/**
 * GET /api/shelves - Get all shelves for the authenticated user
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const shelves = await getShelvesByUserId(session.userId);

    return NextResponse.json({
      success: true,
      data: shelves,
    });
  } catch (error) {
    console.error('Error fetching shelves:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shelves' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shelves - Create a new shelf for the authenticated user
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Shelf name is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: 'Shelf name must be 100 characters or less' },
        { status: 400 }
      );
    }

    const shelf = await createShelf(session.userId, {
      name: name.trim(),
      description: description || null,
      is_default: false,
    });

    return NextResponse.json({
      success: true,
      data: shelf,
    });
  } catch (error: any) {
    console.error('Error creating shelf:', error);
    
    // Handle unique constraint violation (duplicate name)
    if (error?.message?.includes('shelves_user_name_unique')) {
      return NextResponse.json(
        { success: false, error: 'You already have a shelf with this name' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create shelf' },
      { status: 500 }
    );
  }
}
