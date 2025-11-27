import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getShelfById, getItemsByShelfId, updateShelf, deleteShelf } from '@/lib/db/queries';
import type { Shelf } from '@/lib/types/shelf';

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
            return NextResponse.json(
                { success: false, error: 'Shelf not found' },
                { status: 404 }
            );
        }

        // Check if user owns shelf or shelf is public
        if (shelf.user_id !== session?.userId && !shelf.is_public) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
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
                shelf_type: shelf.shelf_type,
                share_token: shelf.share_token,
                items,
                created_at: shelf.created_at,
            },
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
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { shelfId } = await params;
        const body = await request.json();

        // Get shelf
        const shelf = await getShelfById(shelfId);
        if (!shelf) {
            return NextResponse.json(
                { success: false, error: 'Shelf not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (shelf.user_id !== session.userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const updateData: ShelfUpdateData = {};

        // Validate name if provided
        if (body.name !== undefined) {
            if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Shelf name is required' },
                    { status: 400 }
                );
            }
            if (body.name.length > 100) {
                return NextResponse.json(
                    { success: false, error: 'Shelf name must be 100 characters or less' },
                    { status: 400 }
                );
            }
            updateData.name = body.name.trim();
        }

        // Validate description if provided
        if (body.description !== undefined) {
            if (body.description && typeof body.description !== 'string') {
                return NextResponse.json(
                    { success: false, error: 'Description must be a string' },
                    { status: 400 }
                );
            }
            if (body.description && body.description.length > 1000) {
                return NextResponse.json(
                    { success: false, error: 'Description must be 1000 characters or less' },
                    { status: 400 }
                );
            }
            updateData.description = body.description?.trim() || null;
        }

        // Validate is_public if provided
        if (body.is_public !== undefined) {
            if (typeof body.is_public !== 'boolean') {
                return NextResponse.json(
                    { success: false, error: 'is_public must be a boolean' },
                    { status: 400 }
                );
            }
            updateData.is_public = body.is_public;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, error: 'No fields to update' },
                { status: 400 }
            );
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
        console.error('Error updating shelf:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update shelf' },
            { status: 500 }
        );
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
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { shelfId } = await params;

        // Get shelf
        const shelf = await getShelfById(shelfId);
        if (!shelf) {
            return NextResponse.json(
                { success: false, error: 'Shelf not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (shelf.user_id !== session.userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Delete shelf (cascades to items)
        await deleteShelf(shelfId);

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
