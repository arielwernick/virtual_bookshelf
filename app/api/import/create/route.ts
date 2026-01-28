import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { createShelf, createItem } from '@/lib/db/queries';
import { detectItemType } from '@/lib/utils/itemTypeDetector';
import { getDomain } from '@/lib/utils/urlResolver';
import { CreateItemData } from '@/lib/types/shelf';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ImportCreate');

const MAX_ITEMS = 50;
const MAX_TITLE_LENGTH = 100;
const MAX_NOTES_LENGTH = 2000;

interface ImportItem {
  url: string;
  title?: string;
  creator?: string;
  imageUrl?: string;
  notes?: string;
}

interface CreateShelfWithItemsRequest {
  title: string;
  description?: string;
  items: ImportItem[];
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - please log in first' },
        { status: 401 }
      );
    }

    const body: CreateShelfWithItemsRequest = await request.json();
    const { title, description, items } = body;

    // Validate shelf title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Shelf title is required' },
        { status: 400 }
      );
    }

    if (title.trim().length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Shelf title must be ${MAX_TITLE_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }

    if (items.length > MAX_ITEMS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_ITEMS} items allowed per import` },
        { status: 400 }
      );
    }

    // Validate each item has a URL
    for (const item of items) {
      if (!item.url || typeof item.url !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Each item must have a valid URL' },
          { status: 400 }
        );
      }
    }

    logger.info(`Creating shelf with ${items.length} items for user ${session.userId}`);

    // Create the shelf
    const shelf = await createShelf(
      session.userId,
      title.trim(),
      description?.trim() || null
    );

    // Create items in order
    const createdItems = [];
    const failedItems = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        // Detect item type from URL
        const type = detectItemType(item.url);
        
        // Extract domain for fallback creator
        const domain = getDomain(item.url);
        
        // Build item data
        const itemData: CreateItemData = {
          type,
          title: (item.title || domain).slice(0, 255), // DB column limit
          creator: (item.creator || domain).slice(0, 255),
          image_url: item.imageUrl || undefined,
          external_url: item.url,
          notes: item.notes?.slice(0, MAX_NOTES_LENGTH) || undefined,
          order_index: i,
        };

        const createdItem = await createItem(shelf.id, itemData, session.userId);
        createdItems.push(createdItem);
      } catch (error) {
        logger.warn(`Failed to create item ${i} (${item.url}):`, error);
        failedItems.push({ index: i, url: item.url, error: 'Failed to create item' });
      }
    }

    logger.info(`Created shelf ${shelf.id} with ${createdItems.length} items (${failedItems.length} failed)`);

    return NextResponse.json({
      success: true,
      data: {
        shelf: {
          id: shelf.id,
          name: shelf.name,
          description: shelf.description,
          share_token: shelf.share_token,
        },
        itemsCreated: createdItems.length,
        itemsFailed: failedItems.length,
        failedItems: failedItems.length > 0 ? failedItems : undefined,
      },
    });
  } catch (error) {
    logger.errorWithException('Failed to create shelf with items', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create shelf' },
      { status: 500 }
    );
  }
}
