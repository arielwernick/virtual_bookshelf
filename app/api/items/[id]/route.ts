import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getItemById, updateItem, deleteItem } from '@/lib/db/queries';
import { validateText, validateUrl, validateNotes } from '@/lib/utils/validation';
import { UpdateItemData } from '@/lib/types/shelf';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
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

    // Check ownership
    if (existingItem.user_id !== session.userId) {
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
        return NextResponse.json(
          { success: false, error: titleValidation.error },
          { status: 400 }
        );
      }
      updateData.title = body.title;
    }

    if (body.creator !== undefined) {
      const creatorValidation = validateText(body.creator, 'Creator');
      if (!creatorValidation.valid) {
        return NextResponse.json(
          { success: false, error: creatorValidation.error },
          { status: 400 }
        );
      }
      updateData.creator = body.creator;
    }

    if (body.image_url !== undefined) {
      if (body.image_url) {
        const imageValidation = validateUrl(body.image_url, 'Image URL');
        if (!imageValidation.valid) {
          return NextResponse.json(
            { success: false, error: imageValidation.error },
            { status: 400 }
          );
        }
      }
      updateData.image_url = body.image_url;
    }

    if (body.external_url !== undefined) {
      if (body.external_url) {
        const urlValidation = validateUrl(body.external_url, 'External URL');
        if (!urlValidation.valid) {
          return NextResponse.json(
            { success: false, error: urlValidation.error },
            { status: 400 }
          );
        }
      }
      updateData.external_url = body.external_url;
    }

    if (body.notes !== undefined) {
      if (body.notes) {
        const notesValidation = validateNotes(body.notes);
        if (!notesValidation.valid) {
          return NextResponse.json(
            { success: false, error: notesValidation.error },
            { status: 400 }
          );
        }
      }
      updateData.notes = body.notes;
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
    console.error('Error updating item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get existing item
    const existingItem = await getItemById(id);
    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingItem.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete item
    await deleteItem(id);

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
