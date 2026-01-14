import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { createShelf } from '@/lib/db/queries';
import { validateShelfType } from '@/lib/utils/top5';
import { ShelfType } from '@/lib/types/shelf';
import { createLogger } from '@/lib/utils/logger';
import {
  authRequiredError,
  validationError,
  internalError,
} from '@/lib/utils/errors';

const logger = createLogger('ShelfCreate');

/**
 * Create a new shelf for the authenticated user
 * Requires: user must be logged in with valid session
 * Request body: { name: string, description?: string, shelf_type?: 'standard' | 'top5' }
 */
export async function POST(request: Request) {
  try {
    // Check for valid session
    const session = await getSession();
    if (!session || !session.userId) {
      return authRequiredError('Unauthorized - please log in first');
    }

    const body = await request.json();
    const { name, description, shelf_type } = body;

    // Validate shelf name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return validationError('Shelf name is required');
    }

    if (name.trim().length > 100) {
      return validationError('Shelf name must be 100 characters or less');
    }

    // Validate optional description
    if (description && typeof description !== 'string') {
      return validationError('Description must be a string');
    }

    if (description && description.length > 1000) {
      return validationError('Description must be 1000 characters or less');
    }

    // Validate optional shelf_type
    let shelfType: ShelfType = 'standard';
    if (shelf_type !== undefined) {
      const typeValidation = validateShelfType(shelf_type);
      if (!typeValidation.valid) {
        return validationError(typeValidation.error || 'Invalid shelf type');
      }
      shelfType = shelf_type as ShelfType;
    }

    // Create shelf
    const shelf = await createShelf(
      session.userId,
      name.trim(),
      description?.trim() || null,
      shelfType
    );

    return NextResponse.json({
      success: true,
      data: {
        id: shelf.id,
        name: shelf.name,
        description: shelf.description,
        share_token: shelf.share_token,
        shelf_type: shelf.shelf_type,
        created_at: shelf.created_at,
      },
    });
  } catch (error) {
    logger.errorWithException('Failed to create shelf', error);
    return internalError('Failed to create shelf');
  }
}
