import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getShelfById, updateShelf } from '@/lib/db/queries';

const MAX_TITLE_LENGTH = 100;

export async function PATCH(request: Request) {
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
        const { shelf_id, title } = body;

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

        // Validate title length (using name field for shelf name)
        if (title && typeof title === 'string' && title.length > MAX_TITLE_LENGTH) {
            return NextResponse.json(
                { success: false, error: `Title must be ${MAX_TITLE_LENGTH} characters or less` },
                { status: 400 }
            );
        }

        // Update the shelf's name
        const updatedShelf = await updateShelf(shelf_id, { name: title || 'My Shelf' });

        return NextResponse.json({
            success: true,
            data: {
                id: updatedShelf.id,
                name: updatedShelf.name,
            },
        });
    } catch (error) {
        console.error('Error updating shelf title:', error);
        return NextResponse.json({ success: false, error: 'Failed to update shelf title' }, { status: 500 });
    }
}
