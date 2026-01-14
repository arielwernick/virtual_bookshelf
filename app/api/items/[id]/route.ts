import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getItemById, updateItem, deleteItem, getShelfById } from '@/lib/db/queries';
import { validateText, validateUrl, validateNotes, validateRating } from '@/lib/utils/validation';
import { UpdateItemData } from '@/lib/types/shelf';
import { createLogger } from '@/lib/utils/logger';
import {
  authRequiredError,
  notFoundError,
  forbiddenError,
  validationError,
  internalError,
} from '@/lib/utils/errors';

const logger = createLogger('ItemById');

/**
 * PATCH: Update an item
 * Requires: user must own the shelf containing the item
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Get existing item
    const existingItem = await getItemById(id);
    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check ownership via shelf
    const shelf = await getShelfById(existingItem.shelf_id);
    if (!shelf || shelf.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Build update data with validation
    const updateData: UpdateItemData = {};

    if (body.title !== undefined) {
      const titleValidation = validateText(body.title, 'Title');
      if (!titleValidation.valid) {
        return validationError(titleValidation.error || 'Invalid title');
      }
      updateData.title = body.title;
    }

    if (body.creator !== undefined) {
      const creatorValidation = validateText(body.creator, 'Creator');
      if (!creatorValidation.valid) {
        return validationError(creatorValidation.error || 'Invalid creator');
      }
      updateData.creator = body.creator;
    }

    if (body.image_url !== undefined) {
      if (body.image_url) {
        const imageValidation = validateUrl(body.image_url, 'Image URL');
        if (!imageValidation.valid) {
          return validationError(imageValidation.error || 'Invalid image URL');
        }
      }
      updateData.image_url = body.image_url;
    }

    if (body.external_url !== undefined) {
      if (body.external_url) {
        const urlValidation = validateUrl(body.external_url, 'External URL');
        if (!urlValidation.valid) {
          return validationError(urlValidation.error || 'Invalid external URL');
        }
      }
      updateData.external_url = body.external_url;
    }

    if (body.notes !== undefined) {
      if (body.notes) {
        const notesValidation = validateNotes(body.notes);
        if (!notesValidation.valid) {
          return validationError(notesValidation.error || 'Invalid notes');
        }
      }
      updateData.notes = body.notes;
    }

    if (body.rating !== undefined) {
      if (body.rating !== null) {
        const ratingValidation = validateRating(body.rating);
        if (!ratingValidation.valid) {
          return validationError(ratingValidation.error || 'Invalid rating');
        }
      }
      updateData.rating = body.rating;
    }

    if (body.order_index !== undefined) {
      updateData.order_index = body.order_index;
    }

    // Update item
    const updatedItem = await updateItem(id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    logger.errorWithException('Failed to update item', error);
    return internalError('Failed to update item');
  }
}

/**
 * DELETE: Delete an item
 * Requires: user must own the shelf containing the item
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session || !session.userId) {
      return authRequiredError();
    }

    const { id } = await params;

    // Get existing item
    const existingItem = await getItemById(id);
    if (!existingItem) {
      return notFoundError('Item');
    }

    // Check ownership via shelf
    const shelf = await getShelfById(existingItem.shelf_id);
    if (!shelf || shelf.user_id !== session.userId) {
      return forbiddenError();
    }

    // Delete item
    await deleteItem(id);

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    logger.errorWithException('Failed to delete item', error);
    return internalError('Failed to delete item');
  }
}
