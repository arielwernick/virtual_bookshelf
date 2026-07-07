import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { z } from 'zod';
import {
  createItem,
  createShelf,
  deleteItem,
  getItemById,
  getItemsByShelfId,
  getLiveOAuthAccessToken,
  getNextOrderIndex,
  getShelfById,
  getShelvesForDashboard,
  updateItem,
} from '@/lib/db/queries';
import { searchBooks } from '@/lib/api/googleBooks';
import { searchMusic, searchPodcasts } from '@/lib/api/spotify';
import { getOAuthIssuer, hashToken } from '@/lib/utils/oauth';
import { createLogger } from '@/lib/utils/logger';
import { RESOURCE_ERRORS } from '@/lib/constants/errors';
import type { Item, ItemType, Shelf } from '@/lib/types/shelf';

const logger = createLogger('MCP');

const ITEM_TYPES = [
  'book',
  'podcast',
  'music',
  'podcast_episode',
  'video',
  'link',
  'stock',
] as const satisfies readonly ItemType[];

/** Tool result helpers — MCP tools return content blocks, not HTTP responses. */
function jsonResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return {
    content: [{ type: 'text' as const, text: `Error: ${message}` }],
    isError: true,
  };
}

function getUserId(extra: { authInfo?: AuthInfo }): string {
  const userId = (extra.authInfo?.extra as { userId?: string } | undefined)?.userId;
  if (!userId) {
    throw new Error('Missing authenticated user');
  }
  return userId;
}

/** Load a shelf and verify it belongs to the authenticated user. */
async function getOwnedShelf(shelfId: string, userId: string): Promise<Shelf | null> {
  const shelf = await getShelfById(shelfId);
  if (!shelf || shelf.user_id !== userId) {
    return null;
  }
  return shelf;
}

function serializeItem(item: Item) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    creator: item.creator,
    notes: item.notes,
    rating: item.rating,
    external_url: item.external_url,
    image_url: item.image_url,
  };
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'list_shelves',
      "List all of the user's shelves with item counts and share links.",
      {},
      async (_args, extra) => {
        const userId = getUserId(extra);
        const shelves = await getShelvesForDashboard(userId);
        return jsonResult(
          shelves.map((shelf) => ({
            id: shelf.id,
            name: shelf.name,
            description: shelf.description,
            is_public: shelf.is_public,
            item_count: shelf.item_count,
            share_url: `${getOAuthIssuer()}/s/${shelf.share_token}`,
          }))
        );
      }
    );

    server.tool(
      'get_shelf',
      'Get a shelf and all items on it.',
      { shelf_id: z.string().describe('Shelf ID from list_shelves') },
      async ({ shelf_id }, extra) => {
        const userId = getUserId(extra);
        const shelf = await getOwnedShelf(shelf_id, userId);
        if (!shelf) {
          return errorResult(RESOURCE_ERRORS.SHELF_NOT_FOUND);
        }
        const items = await getItemsByShelfId(shelf_id);
        return jsonResult({
          id: shelf.id,
          name: shelf.name,
          description: shelf.description,
          is_public: shelf.is_public,
          share_url: `${getOAuthIssuer()}/s/${shelf.share_token}`,
          items: items.map(serializeItem),
        });
      }
    );

    server.tool(
      'create_shelf',
      'Create a new shelf.',
      {
        name: z.string().min(1).max(100).describe('Shelf name'),
        description: z.string().max(1000).optional().describe('Optional description'),
      },
      async ({ name, description }, extra) => {
        const userId = getUserId(extra);
        const shelf = await createShelf(userId, name.trim(), description?.trim() || null);
        return jsonResult({
          id: shelf.id,
          name: shelf.name,
          description: shelf.description,
          share_url: `${getOAuthIssuer()}/s/${shelf.share_token}`,
        });
      }
    );

    server.tool(
      'add_item',
      'Add an item (book, podcast, music, video, link…) to a shelf. ' +
        'Use search_catalog first to find accurate metadata (title, creator, image, URL).',
      {
        shelf_id: z.string().describe('Shelf ID from list_shelves'),
        type: z.enum(ITEM_TYPES).describe('Item type'),
        title: z.string().min(1).max(500).describe('Item title'),
        creator: z
          .string()
          .max(500)
          .optional()
          .describe('Author, artist, host, or channel name'),
        image_url: z.string().url().optional().describe('Cover or thumbnail image URL'),
        external_url: z.string().url().optional().describe('Link to the item'),
        notes: z.string().max(2000).optional().describe('Personal note to show with the item'),
      },
      async ({ shelf_id, type, title, creator, image_url, external_url, notes }, extra) => {
        const userId = getUserId(extra);
        const shelf = await getOwnedShelf(shelf_id, userId);
        if (!shelf) {
          return errorResult(RESOURCE_ERRORS.SHELF_NOT_FOUND);
        }
        const orderIndex = await getNextOrderIndex(shelf_id);
        const item = await createItem(
          shelf_id,
          {
            type,
            title: title.trim(),
            creator: creator?.trim() || '',
            image_url,
            external_url,
            notes,
            order_index: orderIndex,
          },
          userId
        );
        return jsonResult({ added: serializeItem(item), shelf: shelf.name });
      }
    );

    server.tool(
      'update_item_note',
      "Set or replace the personal note on an item (pass an empty string to clear it).",
      {
        item_id: z.string().describe('Item ID from get_shelf'),
        notes: z.string().max(2000).describe('New note text'),
      },
      async ({ item_id, notes }, extra) => {
        const userId = getUserId(extra);
        const item = await getItemById(item_id);
        const shelf = item && (await getOwnedShelf(item.shelf_id, userId));
        if (!item || !shelf) {
          return errorResult(RESOURCE_ERRORS.ITEM_NOT_FOUND);
        }
        const updated = await updateItem(item_id, { notes });
        return jsonResult(serializeItem(updated));
      }
    );

    server.tool(
      'remove_item',
      'Remove an item from a shelf.',
      { item_id: z.string().describe('Item ID from get_shelf') },
      async ({ item_id }, extra) => {
        const userId = getUserId(extra);
        const item = await getItemById(item_id);
        const shelf = item && (await getOwnedShelf(item.shelf_id, userId));
        if (!item || !shelf) {
          return errorResult(RESOURCE_ERRORS.ITEM_NOT_FOUND);
        }
        await deleteItem(item_id);
        return jsonResult({ removed: item.title, shelf: shelf.name });
      }
    );

    server.tool(
      'search_catalog',
      'Search for books (Google Books), music albums, or podcasts (Spotify) to get ' +
        'accurate metadata before adding an item with add_item.',
      {
        query: z.string().min(1).describe('Search query, e.g. a title or author'),
        type: z.enum(['book', 'music', 'podcast']).describe('What to search for'),
      },
      async ({ query, type }) => {
        const results =
          type === 'book'
            ? await searchBooks(query)
            : type === 'music'
              ? await searchMusic(query)
              : await searchPodcasts(query);
        return jsonResult(
          results.slice(0, 5).map((result) => ({
            type,
            title: result.title,
            creator: result.creator,
            image_url: result.imageUrl,
            external_url: result.externalUrl,
          }))
        );
      }
    );
  },
  {
    serverInfo: { name: 'virtual-bookshelf', version: '1.0.0' },
  },
  {
    basePath: '/api/mcp',
    disableSse: true,
    maxDuration: 60,
  }
);

/**
 * Resolve an opaque bearer token to the user it belongs to.
 * Tokens are stored hashed; unknown/expired tokens return undefined, which
 * makes withMcpAuth reply 401 with WWW-Authenticate pointing at our
 * protected-resource metadata so clients can start the OAuth flow.
 */
async function verifyToken(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  if (!bearerToken) {
    return undefined;
  }
  try {
    const record = await getLiveOAuthAccessToken(await hashToken(bearerToken));
    if (!record) {
      return undefined;
    }
    return {
      token: bearerToken,
      clientId: record.client_id,
      scopes: record.scope.split(' '),
      expiresAt: Math.floor(new Date(record.expires_at).getTime() / 1000),
      extra: { userId: record.user_id },
    };
  } catch (error) {
    logger.errorWithException('Token verification failed', error);
    return undefined;
  }
}

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
