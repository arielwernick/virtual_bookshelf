import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { createItem, getNextOrderIndex } from '@/lib/db/queries';
import { validateItemType, validateText, validateUrl, validateNotes } from '@/lib/utils/validation';
import { CreateItemData } from '@/lib/types/shelf';

export async function POST(request: Request) {
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
    const { type, title, creator, image_url, external_url, notes } = body;

    // Validate type
    const typeValidation = validateItemType(type);
    if (!typeValidation.valid) {
      return NextResponse.json(
        { success: false, error: typeValidation.error },
        { status: 400 }
      );
    }

    // Validate title
    const titleValidation = validateText(title, 'Title');
    if (!titleValidation.valid) {
      return NextResponse.json(
        { success: false, error: titleValidation.error },
        { status: 400 }
      );
    }

    // Validate creator
    const creatorValidation = validateText(creator, 'Creator');
    if (!creatorValidation.valid) {
      return NextResponse.json(
        { success: false, error: creatorValidation.error },
        { status: 400 }
      );
    }

    // Validate image_url if provided
    if (image_url) {
      const imageValidation = validateUrl(image_url, 'Image URL');
      if (!imageValidation.valid) {
        return NextResponse.json(
          { success: false, error: imageValidation.error },
          { status: 400 }
        );
      }
    }

    // Validate external_url if provided
    if (external_url) {
      const urlValidation = validateUrl(external_url, 'External URL');
      if (!urlValidation.valid) {
        return NextResponse.json(
          { success: false, error: urlValidation.error },
          { status: 400 }
        );
      }
    }

    // Validate notes if provided
    if (notes) {
      const notesValidation = validateNotes(notes);
      if (!notesValidation.valid) {
        return NextResponse.json(
          { success: false, error: notesValidation.error },
          { status: 400 }
        );
      }
    }

    // Get next order index
    const orderIndex = await getNextOrderIndex(session.userId);

    // Create item
    const itemData: CreateItemData = {
      type,
      title,
      creator,
      image_url: image_url || undefined,
      external_url: external_url || undefined,
      notes: notes || undefined,
      order_index: orderIndex,
    };

    const item = await createItem(session.userId, itemData);

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
