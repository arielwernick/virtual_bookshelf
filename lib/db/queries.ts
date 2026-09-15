import { sql, sqlQuery } from './client';
import { User, Item, Shelf, CreateItemData, UpdateItemData, ShelfWithItems, DashboardShelf, ShelfPreviewItem, OAuthClient, OAuthAuthorizationCode, OAuthAccessToken } from '../types/shelf';
import { generateShortToken } from '../utils/token';
import { extractVideoId } from '../api/youtube';

// ============================================================================
// DYNAMIC UPDATE HELPER
// ============================================================================

interface DynamicUpdateResult {
  query: string;
  values: unknown[];
}

/**
 * Build a parameterized UPDATE query from a partial data object.
 *
 * Only fields present in `allowedFields` whose values are not `undefined`
 * are included – every value gets its own positional placeholder ($1, $2, …)
 * so the query stays safe from injection.
 *
 * Always appends `updated_at = NOW()` and puts the row id last.
 */
function buildDynamicUpdate<T extends object>(
  table: string,
  id: string,
  data: T,
  allowedFields: readonly string[],
): DynamicUpdateResult {
  const record = data as Record<string, unknown>;
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (record[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex++}`);
      values.push(record[field]);
    }
  }

  if (setClauses.length === 0) {
    throw new Error('No fields to update');
  }

  setClauses.push('updated_at = NOW()');
  values.push(id);

  const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  return { query, values };
}

/** Execute a parameterized query string (as opposed to a tagged template). */
function execParameterized(query: string, values: unknown[]): Promise<unknown[]> {
  return sqlQuery(query, values);
}

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Create a new user (password-based auth)
 */
export async function createUser(
  data: {
    username?: string;
    email: string;
    passwordHash?: string;
    googleId?: string;
    name?: string;
  }
): Promise<User> {
  const result = await sql`
    INSERT INTO users (username, email, password_hash, google_id)
    VALUES (${data.username || null}, ${data.email}, ${data.passwordHash || null}, ${data.googleId || null})
    RETURNING *
  `;

  return result[0] as User;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users
    WHERE username = ${username}
    LIMIT 1
  `;

  return result.length > 0 ? (result[0] as User) : null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  return result.length > 0 ? (result[0] as User) : null;
}

/**
 * Get user by Google ID
 */
export async function getUserByGoogleId(googleId: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users
    WHERE google_id = ${googleId}
    LIMIT 1
  `;

  return result.length > 0 ? (result[0] as User) : null;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return result.length > 0 ? (result[0] as User) : null;
}

/**
 * Get user by share token (legacy, for default shelf)
 */
export async function getUserByShareToken(shareToken: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users
    WHERE share_token = ${shareToken}
    LIMIT 1
  `;

  return result.length > 0 ? (result[0] as User) : null;
}

/**
 * Update user with Google ID (for account linking)
 */
export async function updateUserGoogleId(userId: string, googleId: string): Promise<User> {
  const result = await sql`
    UPDATE users
    SET google_id = ${googleId}
    WHERE id = ${userId}
    RETURNING *
  `;

  return result[0] as User;
}

/**
 * Update user shelf description
 */
export async function updateUserDescription(userId: string, description: string | null): Promise<User> {
  const result = await sql`
    UPDATE users
    SET description = ${description}
    WHERE id = ${userId}
    RETURNING *
  `;

  return result[0] as User;
}

/**
 * Update user shelf title
 */
export async function updateUserTitle(userId: string, title: string | null): Promise<User> {
  const result = await sql`
    UPDATE users
    SET title = ${title}
    WHERE id = ${userId}
    RETURNING *
  `;

  return result[0] as User;
}

// ============================================================================
// SHELF QUERIES
// ============================================================================

/**
 * Create a new shelf with a short share token
 */
export async function createShelf(
  userId: string,
  name: string,
  description?: string | null
): Promise<Shelf> {
  const shareToken = generateShortToken();
  
  const result = await sql`
    INSERT INTO shelves (user_id, name, description, share_token)
    VALUES (${userId}, ${name}, ${description || null}, ${shareToken})
    RETURNING *
  `;

  return result[0] as Shelf;
}

/**
 * Get shelf by ID
 */
export async function getShelfById(shelfId: string): Promise<Shelf | null> {
  const result = await sql`
    SELECT * FROM shelves
    WHERE id = ${shelfId}
    LIMIT 1
  `;

  return result.length > 0 ? (result[0] as Shelf) : null;
}

/**
 * Get shelf by share token
 */
export async function getShelfByShareToken(shareToken: string): Promise<Shelf | null> {
  const result = await sql`
    SELECT * FROM shelves
    WHERE share_token = ${shareToken}
    LIMIT 1
  `;

  return result.length > 0 ? (result[0] as Shelf) : null;
}

/**
 * Get all shelves for a user
 */
export async function getShelfsByUserId(userId: string): Promise<Shelf[]> {
  const result = await sql`
    SELECT * FROM shelves
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return result as Shelf[];
}

/**
 * Get all of a user's shelves with total item counts and the first few items
 * for cover previews, in a single query (avoids per-shelf item fetches).
 *
 * @param userId - User ID to fetch shelves for
 * @param maxItemsPerShelf - Maximum number of preview items per shelf
 * @returns Array of shelves with item_count and preview_items
 */
export async function getShelvesForDashboard(
  userId: string,
  maxItemsPerShelf: number = 6
): Promise<DashboardShelf[]> {
  interface RawDashboardShelf extends Shelf {
    item_count: number;
    preview_items: ShelfPreviewItem[];
  }

  const result = await sql`
    SELECT
      s.id,
      s.user_id,
      s.name,
      s.description,
      s.share_token,
      s.is_public,
      s.created_at,
      s.updated_at,
      (SELECT COUNT(*)::int FROM items WHERE shelf_id = s.id) as item_count,
      COALESCE(
        json_agg(
          CASE WHEN i.id IS NOT NULL THEN
            json_build_object(
              'id', i.id,
              'type', i.type,
              'title', i.title,
              'creator', i.creator,
              'image_url', i.image_url
            )
          END
          ORDER BY i.order_index ASC
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
      ) as preview_items
    FROM shelves s
    LEFT JOIN LATERAL (
      SELECT id, type, title, creator, image_url, order_index FROM items
      WHERE shelf_id = s.id
      ORDER BY order_index ASC
      LIMIT ${maxItemsPerShelf}
    ) i ON true
    WHERE s.user_id = ${userId}
    GROUP BY s.id, s.user_id, s.name, s.description, s.share_token,
             s.is_public, s.created_at, s.updated_at
    ORDER BY s.created_at DESC
  `;

  return result as RawDashboardShelf[];
}

/**
 * Get all public shelves for a user (for demo/showcase purposes)
 */
export async function getPublicShelvesByUserId(userId: string): Promise<Shelf[]> {
  const result = await sql`
    SELECT * FROM shelves
    WHERE user_id = ${userId}
    AND is_public = true
    ORDER BY created_at DESC
  `;

  return result as Shelf[];
}

/**
 * Get public shelves with their items in a single optimized query
 * Eliminates N+1 query pattern by using JOIN with LATERAL subquery
 * 
 * @param userId - User ID to fetch shelves for
 * @param maxShelves - Maximum number of shelves to return
 * @param maxItemsPerShelf - Maximum number of items to return per shelf
 * @returns Array of shelves with their associated items
 */
export async function getShelvesWithItems(
  userId: string,
  maxShelves: number = 5,
  maxItemsPerShelf: number = 12
): Promise<ShelfWithItems[]> {
  // Define the shape of the raw database result
  interface RawShelfWithItems {
    shelf_id: string;
    user_id: string;
    name: string;
    description: string | null;
    share_token: string;
    is_public: boolean;
    shelf_created_at: Date;
    shelf_updated_at: Date;
    items: Item[];
  }

  const result = await sql`
    SELECT 
      s.id as shelf_id,
      s.user_id,
      s.name,
      s.description,
      s.share_token,
      s.is_public,
      s.created_at as shelf_created_at,
      s.updated_at as shelf_updated_at,
      COALESCE(
        json_agg(
          CASE WHEN i.id IS NOT NULL THEN
            json_build_object(
              'id', i.id,
              'shelf_id', i.shelf_id,
              'user_id', i.user_id,
              'type', i.type,
              'title', i.title,
              'creator', i.creator,
              'image_url', i.image_url,
              'external_url', i.external_url,
              'notes', i.notes,
              'rating', i.rating,
              'order_index', i.order_index,
              'created_at', i.created_at,
              'updated_at', i.updated_at
            )
          END
          ORDER BY i.order_index ASC
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
      ) as items
    FROM (
      SELECT * FROM shelves
      WHERE user_id = ${userId}
      AND is_public = true
      ORDER BY created_at DESC
      LIMIT ${maxShelves}
    ) s
    LEFT JOIN LATERAL (
      SELECT * FROM items
      WHERE shelf_id = s.id
      ORDER BY order_index ASC
      LIMIT ${maxItemsPerShelf}
    ) i ON true
    GROUP BY s.id, s.user_id, s.name, s.description, s.share_token, 
             s.is_public, s.created_at, s.updated_at
    ORDER BY s.created_at DESC
  `;

  // Transform the flat result into the ShelfWithItems structure
  return (result as RawShelfWithItems[]).map((row) => ({
    shelf: {
      id: row.shelf_id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      share_token: row.share_token,
      is_public: row.is_public,
      created_at: row.shelf_created_at,
      updated_at: row.shelf_updated_at,
    },
    items: row.items,
  }));
}

const SHELF_UPDATABLE_FIELDS = ['name', 'description', 'is_public'] as const;

/**
 * Update shelf with a single atomic query.
 * Only the supplied fields are written; all others are left untouched.
 */
export async function updateShelf(
  shelfId: string,
  data: Partial<Shelf>,
): Promise<Shelf> {
  const { query, values } = buildDynamicUpdate('shelves', shelfId, data, SHELF_UPDATABLE_FIELDS);
  const result = await execParameterized(query, values);
  return result[0] as Shelf;
}

/**
 * Get all public shelves (for sitemap generation)
 */
export async function getPublicShelves(): Promise<{ share_token: string; name: string; updated_at: Date }[]> {
  const result = await sql`
    SELECT share_token, name, updated_at FROM shelves
    WHERE is_public = true
    ORDER BY updated_at DESC
  `;

  return result as { share_token: string; name: string; updated_at: Date }[];
}

/**
 * Delete shelf (cascades to items)
 */
export async function deleteShelf(shelfId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM shelves
    WHERE id = ${shelfId}
    RETURNING id
  `;

  return result.length > 0;
}

// ============================================================================
// ITEM QUERIES
// ============================================================================

/**
 * Create a new item
 */
export async function createItem(shelfId: string, itemData: CreateItemData, userId?: string): Promise<Item> {
  const {
    type,
    title,
    creator,
    image_url = null,
    external_url = null,
    notes = null,
    rating = null,
    order_index = 0,
  } = itemData;

  const result = await sql`
    INSERT INTO items (shelf_id, user_id, type, title, creator, image_url, external_url, notes, rating, order_index)
    VALUES (${shelfId}, ${userId || null}, ${type}, ${title}, ${creator}, ${image_url}, ${external_url}, ${notes}, ${rating}, ${order_index})
    RETURNING *
  `;

  return result[0] as Item;
}

/**
 * Get all items for a shelf
 */
export async function getItemsByShelfId(shelfId: string): Promise<Item[]> {
  const result = await sql`
    SELECT * FROM items
    WHERE shelf_id = ${shelfId}
    ORDER BY order_index ASC, created_at DESC
  `;

  return result as Item[];
}

/**
 * Get items by shelf ID and type
 */
export async function getItemsByShelfIdAndType(shelfId: string, type: string): Promise<Item[]> {
  const result = await sql`
    SELECT * FROM items
    WHERE shelf_id = ${shelfId} AND type = ${type}
    ORDER BY order_index ASC, created_at DESC
  `;

  return result as Item[];
}

/**
 * Get a single item by ID
 */
export async function getItemById(itemId: string): Promise<Item | null> {
  const result = await sql`
    SELECT * FROM items
    WHERE id = ${itemId}
    LIMIT 1
  `;

  return result.length > 0 ? (result[0] as Item) : null;
}

/**
 * A public video item together with the public shelf it belongs to.
 * Backs the /v/[videoId] watch page.
 */
export interface PublicVideo {
  item: Item;
  shelfName: string;
  shelfShareToken: string;
}

/**
 * Find a public video item by its YouTube video ID.
 *
 * `external_url` stores the full watch URL in varying formats (watch?v=,
 * youtu.be/, /embed/, /shorts/), so we narrow with a substring match in SQL
 * and confirm the exact ID in JS via extractVideoId to avoid false positives
 * (e.g. the ID appearing inside an unrelated query param). If the same video
 * lives on multiple public shelves, the earliest-added one wins so the
 * canonical watch page is stable.
 */
export async function getPublicVideoByVideoId(videoId: string): Promise<PublicVideo | null> {
  const rows = await sql`
    SELECT
      i.*,
      s.name AS shelf_name,
      s.share_token AS shelf_share_token
    FROM items i
    JOIN shelves s ON s.id = i.shelf_id
    WHERE i.type = 'video'
      AND s.is_public = true
      AND i.external_url LIKE ${'%' + videoId + '%'}
    ORDER BY i.created_at ASC
  `;

  for (const row of rows as (Item & { shelf_name: string; shelf_share_token: string })[]) {
    if (row.external_url && extractVideoId(row.external_url) === videoId) {
      const { shelf_name, shelf_share_token, ...item } = row;
      return {
        item: item as Item,
        shelfName: shelf_name,
        shelfShareToken: shelf_share_token,
      };
    }
  }

  return null;
}

/**
 * All public video items, for building /v/[videoId] sitemap entries.
 * Returns the raw external_url + updated_at; callers derive/dedupe video IDs.
 */
export async function getPublicVideoItems(): Promise<{ external_url: string | null; updated_at: Date }[]> {
  const result = await sql`
    SELECT i.external_url, i.updated_at
    FROM items i
    JOIN shelves s ON s.id = i.shelf_id
    WHERE i.type = 'video' AND s.is_public = true
    ORDER BY i.updated_at DESC
  `;

  return result as { external_url: string | null; updated_at: Date }[];
}

const ITEM_UPDATABLE_FIELDS = [
  'title', 'creator', 'image_url', 'external_url', 'notes', 'rating', 'order_index',
] as const;

/**
 * Update an item with a single atomic query.
 * Only the supplied fields are written; all others are left untouched.
 */
export async function updateItem(itemId: string, itemData: UpdateItemData): Promise<Item> {
  const { query, values } = buildDynamicUpdate('items', itemId, itemData, ITEM_UPDATABLE_FIELDS);
  const result = await execParameterized(query, values);
  return result[0] as Item;
}

/**
 * Delete an item
 */
export async function deleteItem(itemId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM items
    WHERE id = ${itemId}
    RETURNING id
  `;

  return result.length > 0;
}

/**
 * Update item order for a shelf (batch reorder)
 * Uses two-pass approach to avoid unique constraint violations on (shelf_id, order_index)
 */
export async function updateItemOrder(shelfId: string, itemIds: string[]): Promise<void> {
  // First pass: set all items to negative temporary indices to avoid conflicts
  for (let i = 0; i < itemIds.length; i++) {
    await sql`
      UPDATE items
      SET order_index = ${-(i + 1)}
      WHERE id = ${itemIds[i]} AND shelf_id = ${shelfId}
    `;
  }
  
  // Second pass: set items to their final positive indices
  for (let i = 0; i < itemIds.length; i++) {
    await sql`
      UPDATE items
      SET order_index = ${i}
      WHERE id = ${itemIds[i]} AND shelf_id = ${shelfId}
    `;
  }
}

/**
 * Get the next order index for a shelf
 */
export async function getNextOrderIndex(shelfId: string): Promise<number> {
  const result = await sql`
    SELECT COALESCE(MAX(order_index), -1) + 1 as next_index
    FROM items
    WHERE shelf_id = ${shelfId}
  `;

  return result[0].next_index as number;
}

/**
 * Get the count of items in a shelf
 */
export async function getItemCountForShelf(shelfId: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM items
    WHERE shelf_id = ${shelfId}
  `;

  return parseInt(result[0].count as string, 10);
}

// ============================================================================
// OAUTH QUERIES (MCP connector authorization server)
// ============================================================================

/**
 * Register a new OAuth client (dynamic client registration, RFC 7591)
 */
export async function createOAuthClient(
  clientId: string,
  clientName: string,
  redirectUris: string[]
): Promise<OAuthClient> {
  const result = await sql`
    INSERT INTO oauth_clients (client_id, client_name, redirect_uris)
    VALUES (${clientId}, ${clientName}, ${redirectUris})
    RETURNING *
  `;

  return result[0] as OAuthClient;
}

/**
 * Get an OAuth client by its public client_id
 */
export async function getOAuthClientByClientId(clientId: string): Promise<OAuthClient | null> {
  const result = await sql`
    SELECT * FROM oauth_clients WHERE client_id = ${clientId}
  `;

  return (result[0] as OAuthClient) || null;
}

/**
 * Store a hashed authorization code issued by the consent page
 */
export async function createOAuthAuthorizationCode(data: {
  codeHash: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  scope: string;
  expiresAt: Date;
}): Promise<OAuthAuthorizationCode> {
  const result = await sql`
    INSERT INTO oauth_authorization_codes
      (code_hash, client_id, user_id, redirect_uri, code_challenge, scope, expires_at)
    VALUES
      (${data.codeHash}, ${data.clientId}, ${data.userId}, ${data.redirectUri},
       ${data.codeChallenge}, ${data.scope}, ${data.expiresAt.toISOString()})
    RETURNING *
  `;

  return result[0] as OAuthAuthorizationCode;
}

/**
 * Atomically consume (delete and return) an authorization code by hash.
 * Single-use by construction: a second exchange finds no row.
 * Returns null if the code does not exist; caller must still check expiry.
 */
export async function consumeOAuthAuthorizationCode(
  codeHash: string
): Promise<OAuthAuthorizationCode | null> {
  const result = await sql`
    DELETE FROM oauth_authorization_codes
    WHERE code_hash = ${codeHash}
    RETURNING *
  `;

  return (result[0] as OAuthAuthorizationCode) || null;
}

/**
 * Store a hashed opaque access token
 */
export async function createOAuthAccessToken(data: {
  tokenHash: string;
  clientId: string;
  userId: string;
  scope: string;
  expiresAt: Date;
}): Promise<OAuthAccessToken> {
  const result = await sql`
    INSERT INTO oauth_access_tokens (token_hash, client_id, user_id, scope, expires_at)
    VALUES (${data.tokenHash}, ${data.clientId}, ${data.userId}, ${data.scope},
            ${data.expiresAt.toISOString()})
    RETURNING *
  `;

  return result[0] as OAuthAccessToken;
}

/**
 * Look up a live access token by hash, touching last_used_at.
 * Returns null for unknown or expired tokens.
 */
export async function getLiveOAuthAccessToken(
  tokenHash: string
): Promise<OAuthAccessToken | null> {
  const result = await sql`
    UPDATE oauth_access_tokens
    SET last_used_at = NOW()
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
    RETURNING *
  `;

  return (result[0] as OAuthAccessToken) || null;
}

/**
 * Revoke all connector tokens for a user (e.g. "disconnect Claude")
 */
export async function deleteOAuthAccessTokensForUser(userId: string): Promise<number> {
  const result = await sql`
    DELETE FROM oauth_access_tokens
    WHERE user_id = ${userId}
    RETURNING id
  `;

  return result.length;
}
