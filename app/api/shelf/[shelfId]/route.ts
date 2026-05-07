import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getShelfById, getItemsByShelfId, updateShelf, deleteShelf } from '@/lib/db/queries';
import type { Shelf } from '@/lib/types/shelf';
import { createLogger } from '@/lib/utils/logger';
import {
  authRequiredError,
  notFoundError,
  forbiddenError,
  validationError,
  internalError,
} from '@/lib/utils/errors';

const logger = createLogger('ShelfById');
type ShelfUpdateData = Partial<Pick<Shelf, 'name' | 'description' | 'is_public'>>;

/**
 * GET: Fetch a specific shelf and its items
 * Requires: user must own the shelf
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ shelfId: string }> }
) {
    try {
        const { shelfId } = await params;
        const session = await getSession();

        // Get shelf
        const shelf = await getShelfById(shelfId);
        if (!shelf) {
            return notFoundError('Shelf');
        }

        // Check if user owns shelf or shelf is public
        if (shelf.user_id !== session?.userId && !shelf.is_public) {
            return forbiddenError();
        }

        // Get shelf's items
        const items = await getItemsByShelfId(shelf.id);

        return NextResponse.json({
            success: true,
            data: {
                id: shelf.id,
                user_id: shelf.user_id,
                name: shelf.name,
                description: shelf.description,
                is_public: shelf.is_public,
                share_token: shelf.share_token,
                items,
                created_at: shelf.created_at,
            },
        });
    } catch (error) {
        logger.errorWithException('Failed to fetch shelf', error);
        return internalError('Failed to fetch shelf');
    }
}

/**
 * PATCH: Update shelf metadata (name, description, is_public)
 * Requires: user must own the shelf
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ shelfId: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return authRequiredError();
        }

        const { shelfId } = await params;
        const body = await request.json();

        // Get shelf
        const shelf = await getShelfById(shelfId);
        if (!shelf) {
            return notFoundError('Shelf');
        }

        // Check ownership
        if (shelf.user_id !== session.userId) {
            return forbiddenError();
        }

        const updateData: ShelfUpdateData = {};

        // Validate name if provided
        if (body.name !== undefined) {
            if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
                return validationError('Shelf name is required');
            }
            if (body.name.length > 100) {
                return validationError('Shelf name must be 100 characters or less');
            }
            updateData.name = body.name.trim();
        }

        // Validate description if provided
        if (body.description !== undefined) {
            if (body.description && typeof body.description !== 'string') {
                return validationError('Description must be a string');
            }
            if (body.description && body.description.length > 1000) {
                return validationError('Description must be 1000 characters or less');
            }
            updateData.description = body.description?.trim() || null;
        }

        // Validate is_public if provided
        if (body.is_public !== undefined) {
            if (typeof body.is_public !== 'boolean') {
                return validationError('is_public must be a boolean');
            }
            updateData.is_public = body.is_public;
        }

        if (Object.keys(updateData).length === 0) {
            return validationError('No fields to update');
        }

        // Update shelf
        const updatedShelf = await updateShelf(shelfId, updateData);

        return NextResponse.json({
            success: true,
            data: {
                id: updatedShelf.id,
                name: updatedShelf.name,
                description: updatedShelf.description,
                is_public: updatedShelf.is_public,
                updated_at: updatedShelf.updated_at,
            },
        });
    } catch (error) {
        logger.errorWithException('Failed to update shelf', error);
        return internalError('Failed to update shelf');
    }
}

/**
 * DELETE: Delete a shelf and all its items
 * Requires: user must own the shelf
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ shelfId: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return authRequiredError();
        }

        const { shelfId } = await params;

        // Get shelf
        const shelf = await getShelfById(shelfId);
        if (!shelf) {
            return notFoundError('Shelf');
        }

        // Check ownership
        if (shelf.user_id !== session.userId) {
            return forbiddenError();
        }

        // Delete shelf (cascades to items)
        await deleteShelf(shelfId);

        return NextResponse.json({
            success: true,
            message: 'Shelf deleted successfully',
        });
    } catch (error) {
        logger.errorWithException('Failed to delete shelf', error);
        return internalError('Failed to delete shelf');
    }
}
