import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { createItem, getNextOrderIndex, getShelfById, getItemsByShelfId } from '@/lib/db/queries';
import { validateItemType, validateText, validateUrl, validateNotes, validateRating } from '@/lib/utils/validation';
import { isTop5Shelf, validateTop5Capacity, validateNoDuplicateItems, TOP5_MAX_ITEMS } from '@/lib/utils/top5';
import { CreateItemData } from '@/lib/types/shelf';
import { createLogger } from '@/lib/utils/logger';
import {
  authRequiredError,
  notFoundError,
  forbiddenError,
  validationError,
  missingFieldError,
  internalError,
} from '@/lib/utils/errors';

const logger = createLogger('ItemsCreate');

/**
 * Create a new item in a shelf
 * Requires: user must be authenticated and own the shelf
 * Request body: { shelf_id: string, type: string, title: string, creator: string, ... }
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session || !session.userId) {
      return authRequiredError();
    }

    const body = await request.json();
    const { shelf_id, type, title, creator, image_url, external_url, notes, rating } = body;

    // Validate shelf_id
    if (!shelf_id || typeof shelf_id !== 'string') {
      return missingFieldError('shelf_id');
    }

    // Verify shelf exists and user owns it
    const shelf = await getShelfById(shelf_id);
    if (!shelf) {
      return notFoundError('Shelf');
    }

    if (shelf.user_id !== session.userId) {
      return forbiddenError('Unauthorized - shelf does not belong to you');
    }

    // Validate type
    const typeValidation = validateItemType(type);
    if (!typeValidation.valid) {
      return validationError(typeValidation.error || 'Invalid item type');
    }

    // Validate title
    const titleValidation = validateText(title, 'Title');
    if (!titleValidation.valid) {
      return validationError(titleValidation.error || 'Invalid title');
    }

    // Validate creator
    const creatorValidation = validateText(creator, 'Creator');
    if (!creatorValidation.valid) {
      return validationError(creatorValidation.error || 'Invalid creator');
    }

    // Validate image_url if provided
    if (image_url) {
      const imageValidation = validateUrl(image_url, 'Image URL');
      if (!imageValidation.valid) {
        return validationError(imageValidation.error || 'Invalid image URL');
      }
    }

    // Validate external_url if provided
    if (external_url) {
      const urlValidation = validateUrl(external_url, 'External URL');
      if (!urlValidation.valid) {
        return validationError(urlValidation.error || 'Invalid external URL');
      }
    }

    // Validate notes if provided
    if (notes) {
      const notesValidation = validateNotes(notes);
      if (!notesValidation.valid) {
        return validationError(notesValidation.error || 'Invalid notes');
      }
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      const ratingValidation = validateRating(rating);
      if (!ratingValidation.valid) {
        return validationError(ratingValidation.error || 'Invalid rating');
      }
    }

    // Top 5 shelf specific validations
    if (isTop5Shelf(shelf)) {
      // Get existing items (also gives us the count)
      const existingItems = await getItemsByShelfId(shelf_id);
      
      // Check capacity
      const capacityValidation = validateTop5Capacity(existingItems.length + 1);
      if (!capacityValidation.valid) {
        return validationError(`Top 5 shelf is full. Maximum ${TOP5_MAX_ITEMS} items allowed.`);
      }

      // Check for duplicates
      const newItemData: CreateItemData = { type, title, creator };
      const duplicateValidation = validateNoDuplicateItems(existingItems, newItemData);
      if (!duplicateValidation.valid) {
        return validationError(duplicateValidation.error || 'Duplicate item');
      }
    }

    // Get next order index for this shelf
    const orderIndex = await getNextOrderIndex(shelf_id);

    // Create item
    const itemData: CreateItemData = {
      type,
      title,
      creator,
      image_url: image_url || undefined,
      external_url: external_url || undefined,
      notes: notes || undefined,
      rating: rating || undefined,
      order_index: orderIndex,
    };

    const item = await createItem(shelf_id, itemData, session.userId);

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    logger.errorWithException('Failed to create item', error);
    return internalError('Failed to create item');
  }
}
