import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { createShelf } from '@/lib/db/queries';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ShelfCreate');

/**
 * Create a new shelf for the authenticated user
 * Requires: user must be logged in with valid session
 * Request body: { name: string, description?: string }
 */
export async function POST(request: Request) {
  try {
    // Check for valid session
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - please log in first' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // Validate shelf name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
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

    // Validate optional description
    if (description && typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Description must be a string' },
        { status: 400 }
      );
    }

    if (description && description.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Description must be 1000 characters or less' },
        { status: 400 }
      );
    }

    // Create shelf
    const shelf = await createShelf(
      session.userId,
      name.trim(),
      description?.trim() || null
    );

    return NextResponse.json({
      success: true,
      data: {
        id: shelf.id,
        name: shelf.name,
        description: shelf.description,
        share_token: shelf.share_token,
        created_at: shelf.created_at,
      },
    });
  } catch (error) {
    logger.errorWithException('Failed to create shelf', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create shelf' },
      { status: 500 }
    );
  }
}
