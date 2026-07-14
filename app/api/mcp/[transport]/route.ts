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
  updateShelf,
} from '@/lib/db/queries';
import { buildSharePath } from '@/lib/utils/slug';
import { revalidateSharedShelf } from '@/lib/utils/revalidateShelf';
import { searchBooks } from '@/lib/api/googleBooks';
import { searchMusic, searchPodcasts } from '@/lib/api/spotify';
import { extractVideoId, getVideoDetails } from '@/lib/api/youtube';
import { fetchLinkMetadata, isYouTubeUrl } from '@/lib/api/microlink';
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

/**
 * Fetch artwork (and a creator fallback) for a URL-backed item, mirroring the
 * web app's add-from-URL flow. Enrichment failures never fail the add itself —
 * the site renders a styled placeholder for items without an image.
 */
async function fetchArtworkFromUrl(
  type: ItemType,
  externalUrl: string
): Promise<{ image_url?: string; creator?: string }> {
  try {
    if (isYouTubeUrl(externalUrl)) {
      const videoId = extractVideoId(externalUrl);
      if (videoId) {
        const video = await getVideoDetails(videoId);
        return { image_url: video.thumbnailUrl, creator: video.channelName };
      }
    }
    if (type === 'video' || type === 'link') {
      const metadata = await fetchLinkMetadata(externalUrl, 8000);
      return {
        image_url: metadata.image ?? undefined,
        creator: metadata.publisher || undefined,
      };
    }
  } catch (error) {
    logger.errorWithException('Artwork enrichment failed', error);
  }
  return {};
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'list_shelves',
      {
        title: 'List shelves',
        description: "List all of the user's shelves with item counts and share links.",
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async (extra) => {
        const userId = getUserId(extra);
        const shelves = await getShelvesForDashboard(userId);
        return jsonResult(
          shelves.map((shelf) => ({
            id: shelf.id,
            name: shelf.name,
            description: shelf.description,
            is_public: shelf.is_public,
            item_count: shelf.item_count,
            share_url: `${getOAuthIssuer()}${buildSharePath(shelf.name, shelf.share_token)}`,
          }))
        );
      }
    );

    server.registerTool(
      'get_shelf',
      {
        title: 'Get shelf contents',
        description: 'Get a shelf and all items on it.',
        inputSchema: { shelf_id: z.string().describe('Shelf ID from list_shelves') },
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
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
          share_url: `${getOAuthIssuer()}${buildSharePath(shelf.name, shelf.share_token)}`,
          items: items.map(serializeItem),
        });
      }
    );

    server.registerTool(
      'create_shelf',
      {
        title: 'Create shelf',
        description:
          'Create a new shelf. New shelves start private — use set_shelf_visibility to publish ' +
          'the share link.',
        inputSchema: {
          name: z.string().min(1).max(100).describe('Shelf name'),
          description: z.string().max(1000).optional().describe('Optional description'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      },
      async ({ name, description }, extra) => {
        const userId = getUserId(extra);
        const shelf = await createShelf(userId, name.trim(), description?.trim() || null);
        return jsonResult({
          id: shelf.id,
          name: shelf.name,
          description: shelf.description,
          is_public: shelf.is_public,
          share_url: `${getOAuthIssuer()}${buildSharePath(shelf.name, shelf.share_token)}`,
        });
      }
    );

    server.registerTool(
      'set_shelf_visibility',
      {
        title: 'Set shelf visibility',
        description:
          'Make a shelf public (anyone with the share link can view it) or private ' +
          '(only the owner can see it; the share link stops working for others).',
        inputSchema: {
          shelf_id: z.string().describe('Shelf ID from list_shelves'),
          is_public: z.boolean().describe('true to make public, false to make private'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ shelf_id, is_public }, extra) => {
        const userId = getUserId(extra);
        const shelf = await getOwnedShelf(shelf_id, userId);
        if (!shelf) {
          return errorResult(RESOURCE_ERRORS.SHELF_NOT_FOUND);
        }
        const updated = await updateShelf(shelf_id, { is_public });
        revalidateSharedShelf(updated.share_token, updated.name);
        return jsonResult({
          id: updated.id,
          name: updated.name,
          is_public: updated.is_public,
          share_url: `${getOAuthIssuer()}${buildSharePath(updated.name, updated.share_token)}`,
        });
      }
    );

    server.registerTool(
      'add_item',
      {
        title: 'Add item to shelf',
        description:
          'Add an item (book, podcast, music, video, link…) to a shelf. ' +
          'Two ways to get accurate metadata and artwork — pick one, never invent your own: ' +
          '(1) for books, music, and podcasts, call search_catalog first and pass its result fields through verbatim; ' +
          '(2) for videos and links, just pass the page URL as external_url — the site fetches artwork ' +
          'and metadata from the URL automatically. ' +
          'Example: add_item(type: "video", title: "How I Built This", external_url: "https://youtube.com/watch?v=...") — no image_url needed.',
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
        inputSchema: {
          shelf_id: z.string().describe('Shelf ID from list_shelves'),
          type: z.enum(ITEM_TYPES).describe('Item type'),
          title: z.string().min(1).max(500).describe('Item title'),
          creator: z
            .string()
            .max(500)
            .optional()
            .describe('Author, artist, host, or channel name'),
          image_url: z
            .string()
            .url()
            .optional()
            .describe(
              'Only pass a URL copied verbatim from a search_catalog result. Otherwise omit — ' +
                'the site fetches artwork from external_url automatically and renders a styled ' +
                'placeholder when no image exists. Never construct, guess, or hotlink image URLs ' +
                '(no Amazon, Goodreads, or Wikipedia image links).'
            ),
          external_url: z
            .string()
            .url()
            .optional()
            .describe('Link to the item — a YouTube, Spotify, article, or product page URL'),
          notes: z
            .string()
            .max(2000)
            .optional()
            .describe('Personal note or short review to show with the item'),
          rating: z
            .number()
            .int()
            .min(0)
            .max(5)
            .optional()
            .describe('Star rating from 0 to 5'),
        },
      },
      async ({ shelf_id, type, title, creator, image_url, external_url, notes, rating }, extra) => {
        const userId = getUserId(extra);
        const shelf = await getOwnedShelf(shelf_id, userId);
        if (!shelf) {
          return errorResult(RESOURCE_ERRORS.SHELF_NOT_FOUND);
        }
        let resolvedImage = image_url;
        let resolvedCreator = creator?.trim() || '';
        if (!resolvedImage && external_url) {
          const artwork = await fetchArtworkFromUrl(type, external_url);
          resolvedImage = artwork.image_url;
          if (!resolvedCreator && artwork.creator) {
            resolvedCreator = artwork.creator;
          }
        }
        const orderIndex = await getNextOrderIndex(shelf_id);
        const item = await createItem(
          shelf_id,
          {
            type,
            title: title.trim(),
            creator: resolvedCreator,
            image_url: resolvedImage,
            external_url,
            notes,
            rating,
            order_index: orderIndex,
          },
          userId
        );
        revalidateSharedShelf(shelf.share_token, shelf.name);
        return jsonResult({ added: serializeItem(item), shelf: shelf.name });
      }
    );

    server.registerTool(
      'review_item',
      {
        title: 'Review item',
        description:
          'Set a star rating and/or a written review (shown as the personal note) on an item. ' +
          'Only the fields you pass are changed. Pass an empty string to clear the note, ' +
          'or rating null to remove the rating.',
        inputSchema: {
          item_id: z.string().describe('Item ID from get_shelf'),
          rating: z
            .number()
            .int()
            .min(0)
            .max(5)
            .nullable()
            .optional()
            .describe('Star rating from 0 to 5, or null to remove the rating'),
          notes: z
            .string()
            .max(2000)
            .optional()
            .describe('Review or note text (empty string clears it)'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ item_id, rating, notes }, extra) => {
        if (rating === undefined && notes === undefined) {
          return errorResult('Provide a rating, notes, or both');
        }
        const userId = getUserId(extra);
        const item = await getItemById(item_id);
        const shelf = item && (await getOwnedShelf(item.shelf_id, userId));
        if (!item || !shelf) {
          return errorResult(RESOURCE_ERRORS.ITEM_NOT_FOUND);
        }
        const updated = await updateItem(item_id, {
          ...(rating !== undefined && { rating }),
          ...(notes !== undefined && { notes: notes || null }),
        });
        revalidateSharedShelf(shelf.share_token, shelf.name);
        return jsonResult(serializeItem(updated));
      }
    );

    server.registerTool(
      'remove_item',
      {
        title: 'Remove item from shelf',
        description: 'Remove an item from a shelf.',
        inputSchema: { item_id: z.string().describe('Item ID from get_shelf') },
        annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
      },
      async ({ item_id }, extra) => {
        const userId = getUserId(extra);
        const item = await getItemById(item_id);
        const shelf = item && (await getOwnedShelf(item.shelf_id, userId));
        if (!item || !shelf) {
          return errorResult(RESOURCE_ERRORS.ITEM_NOT_FOUND);
        }
        await deleteItem(item_id);
        revalidateSharedShelf(shelf.share_token, shelf.name);
        return jsonResult({ removed: item.title, shelf: shelf.name });
      }
    );

    server.registerTool(
      'search_catalog',
      {
        title: 'Search catalog',
        description:
          'Search for books (Google Books), music albums, or podcasts (Spotify) to get ' +
          'accurate metadata before adding an item with add_item. Pass the returned fields ' +
          '(including image_url and external_url) to add_item verbatim — never substitute ' +
          'your own image URLs.',
        inputSchema: {
          query: z.string().min(1).describe('Search query, e.g. a title or author'),
          type: z.enum(['book', 'music', 'podcast']).describe('What to search for'),
        },
        annotations: { readOnlyHint: true, openWorldHint: true },
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
    serverInfo: { name: 'virtual-bookshelf', version: '1.1.0' },
    instructions:
      'Virtual Bookshelf curates shareable shelves of books, podcasts, music, videos, and links. ' +
      'Never supply your own image URLs — the site provides artwork itself. There are exactly two ' +
      'ways to get item metadata: (1) search_catalog for books, music, and podcasts (pass its ' +
      'results to add_item verbatim), or (2) a direct link in external_url for videos and web ' +
      'pages (the site fetches artwork from the URL automatically). Items without artwork ' +
      'get a styled placeholder, which is always better than a wrong or dead image link. ' +
      'Use review_item to rate (0–5 stars) or review items, and set_shelf_visibility to make a ' +
      'shelf public before sharing its link.',
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
