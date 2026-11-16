import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';
import { getShelfsByUserId, getItemsForUserShelves } from '@/lib/db/queries';
import { createLogger } from '@/lib/utils/logger';
import { AUTH_ERRORS } from '@/lib/constants/errors';
import { PUBLIC_SHELF_VERSION, toPublicShelf } from '@/lib/shelf/publicShelf';
import { Item } from '@/lib/types/shelf';

const logger = createLogger('AccountExport');

/**
 * GET /api/account/export
 *
 * Everything the signed-in user has put on their shelves, as one JSON file
 * (issue #289). Each shelf uses the public shelf document format
 * (docs/spec/SHELF_FORMAT.md) plus the owner-only `visibility` field, so an
 * export can be read by anything that reads a public shelf.
 *
 * Private shelves are included: this is the owner's own data.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: AUTH_ERRORS.UNAUTHORIZED },
        { status: 401 }
      );
    }

    // Both queries are scoped to the session's user id; nothing in the
    // request can widen them.
    const [shelves, items] = await Promise.all([
      getShelfsByUserId(session.userId),
      getItemsForUserShelves(session.userId),
    ]);

    const itemsByShelf = new Map<string, Item[]>();
    for (const item of items) {
      const list = itemsByShelf.get(item.shelf_id) ?? [];
      list.push(item);
      itemsByShelf.set(item.shelf_id, list);
    }

    const body = {
      format: 'virtual-bookshelf-export',
      version: PUBLIC_SHELF_VERSION,
      exported_at: new Date().toISOString(),
      shelf_count: shelves.length,
      item_count: items.length,
      shelves: shelves.map((shelf) => ({
        visibility: shelf.is_public ? 'public' : 'private',
        ...toPublicShelf(shelf, itemsByShelf.get(shelf.id) ?? []),
      })),
    };

    const date = body.exported_at.slice(0, 10);
    return new NextResponse(JSON.stringify(body, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="virtual-bookshelf-export-${date}.json"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    logger.errorWithException('Account export failed', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export your shelves' },
      { status: 500 }
    );
  }
}
