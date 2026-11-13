import { deriveItemIdentity } from '@/lib/utils/itemIdentity';
import { sql, sqlQuery, sqlTransaction } from './client';
import { safeHttpUrl } from '../utils/validation';
import { createLogger } from '../utils/logger';

const logger = createLogger('Queries');
import { User, SignupSource, SignupAttribution, AdminOverview, AdminWeeklySignups, AdminAttributionRow, AdminRecentUser, AdminWeeklyViews, AdminTopShelf, AdminEmbedHost, ViewSurface, ShelfViewSummary, Item, Shelf, CreateItemData, UpdateItemData, ShelfWithItems, DashboardShelf, ShelfPreviewItem, OAuthClient, OAuthAuthorizationCode, OAuthAccessToken } from '../types/shelf';
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
 * Create a new user (password or Google auth), recording how they signed up
 */
export async function createUser(
  data: {
    username?: string;
    email: string;
    passwordHash?: string;
    googleId?: string;
    name?: string;
    signupSource?: SignupSource;
    attribution?: SignupAttribution | null;
  }
): Promise<User> {
  const attribution = data.attribution;
  const result = await sql`
    INSERT INTO users (
      username, email, password_hash, google_id,
      signup_source, first_referrer, utm_source, utm_medium, utm_campaign
    )
    VALUES (
      ${data.username || null}, ${data.email}, ${data.passwordHash || null}, ${data.googleId || null},
      ${data.signupSource || null},
      ${attribution?.firstReferrer ?? null},
      ${attribution?.utmSource ?? null},
      ${attribution?.utmMedium ?? null},
      ${attribution?.utmCampaign ?? null}
    )
    RETURNING *
  `;
  const user = result[0] as User;

  // The landing page arrives with migration 008. Written separately, and never
  // allowed to fail the signup, so accounts can be created before it runs.
  if (attribution?.landingPath) {
    try {
      await sql`
        UPDATE users SET first_landing_path = ${attribution.landingPath}
        WHERE id = ${user.id}
      `;
    } catch (error) {
      logger.errorWithException('Could not record the signup landing page', error, { userId: user.id });
    }
  }

  return user;
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

/**
 * Record that a user was active. Writes at most once per hour per user so it
 * is cheap to call on every authenticated dashboard load.
 */
export async function touchUserLastSeen(userId: string): Promise<void> {
  await sql`
    UPDATE users
    SET last_seen_at = NOW()
    WHERE id = ${userId}
      AND (last_seen_at IS NULL OR last_seen_at < NOW() - INTERVAL '1 hour')
  `;
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
 * Delete a shelf and its items
 */
export async function deleteShelf(shelfId: string): Promise<boolean> {
  // items.shelf_id has no foreign key yet (migration 002 deferred it until the
  // existing orphans are cleaned up, issue #153), so nothing cascades: the
  // items must be deleted here. Both statements run as one transaction, so a
  // shelf is never left half-deleted.
  const [, deletedShelves] = (await sqlTransaction((tx) => [
    tx`DELETE FROM items WHERE shelf_id = ${shelfId}`,
    tx`DELETE FROM shelves WHERE id = ${shelfId} RETURNING id`,
  ])) as [unknown[], unknown[]];

  return deletedShelves.length > 0;
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
    notes = null,
    rating = null,
    order_index = 0,
  } = itemData;

  // Last line of defence: whatever path the item came by, only web URLs are
  // stored (issue #296).
  const image_url = safeHttpUrl(itemData.image_url);
  const external_url = safeHttpUrl(itemData.external_url);

  const result = await sql`
    INSERT INTO items (shelf_id, user_id, type, title, creator, image_url, external_url, notes, rating, order_index)
    VALUES (${shelfId}, ${userId || null}, ${type}, ${title}, ${creator}, ${image_url}, ${external_url}, ${notes}, ${rating}, ${order_index})
    RETURNING *
  `;

  return saveItemIdentity(result[0] as Item);
}

/**
 * Record an item's canonical identity (issue #288): which catalogue, which id.
 *
 * Written as its own statement, after the item itself is saved, and never
 * allowed to fail the save. The identity columns arrive with migration 007;
 * if code reaches production before that migration does, items must still be
 * addable. The backfill script fills in anything missed.
 */
async function saveItemIdentity(item: Item): Promise<Item> {
  const identity = deriveItemIdentity(item.type, item.external_url, item.creator);
  const source = identity?.source ?? null;
  const sourceId = identity?.sourceId ?? null;

  if (source === (item.source ?? null) && sourceId === (item.source_id ?? null)) {
    return item;
  }

  try {
    const updated = await sql`
      UPDATE items SET source = ${source}, source_id = ${sourceId}
      WHERE id = ${item.id}
      RETURNING *
    `;
    return (updated[0] as Item) ?? item;
  } catch (error) {
    logger.errorWithException('Could not save item identity; the item itself was saved', error, {
      itemId: item.id,
    });
    return item;
  }
}

/**
 * Every item on every shelf a user owns, for the account export (issue #289).
 * One query, ordered so callers can group by shelf without sorting.
 */
export async function getItemsForUserShelves(userId: string): Promise<Item[]> {
  const result = await sql`
    SELECT i.* FROM items i
    JOIN shelves s ON s.id = i.shelf_id
    WHERE s.user_id = ${userId}
    ORDER BY i.shelf_id, i.order_index ASC
  `;

  return result as Item[];
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
  // Only web URLs are stored (issue #296). `undefined` still means "leave as is".
  const data: UpdateItemData = { ...itemData };
  if (typeof data.external_url === 'string') {
    data.external_url = safeHttpUrl(data.external_url) ?? (null as unknown as string);
  }
  if (typeof data.image_url === 'string') {
    data.image_url = safeHttpUrl(data.image_url) ?? (null as unknown as string);
  }

  const { query, values } = buildDynamicUpdate('items', itemId, data, ITEM_UPDATABLE_FIELDS);
  const result = await execParameterized(query, values);
  const item = result[0] as Item;

  // Keep the canonical identity in step when the URL (or a stock's ticker,
  // stored in creator) changes.
  if (item && (itemData.external_url !== undefined || itemData.creator !== undefined)) {
    return saveItemIdentity(item);
  }

  return item;
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
  if (itemIds.length === 0) return;

  // (shelf_id, order_index) is unique, so items can't be moved straight to
  // their new positions: each first goes to a negative placeholder, then to
  // its final index. All of it runs as one transaction in one round trip, so
  // a failure part-way leaves the old order untouched instead of a shelf with
  // negative positions (issue #296).
  await sqlTransaction((tx) => [
    ...itemIds.map(
      (id, i) => tx`
        UPDATE items
        SET order_index = ${-(i + 1)}
        WHERE id = ${id} AND shelf_id = ${shelfId}
      `
    ),
    ...itemIds.map(
      (id, i) => tx`
        UPDATE items
        SET order_index = ${i}
        WHERE id = ${id} AND shelf_id = ${shelfId}
      `
    ),
  ]);
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

// ============================================================================
// ADMIN QUERIES
// ============================================================================

/** Minimum items on a single shelf for a user to count as "activated". */
export const ACTIVATION_ITEM_THRESHOLD = 3;

/**
 * Headline user counts for the admin dashboard
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const result = await sql`
    SELECT
      COUNT(*)::int AS total_users,
      COUNT(*) FILTER (WHERE u.created_at > NOW() - INTERVAL '7 days')::int AS new_users_7d,
      COUNT(*) FILTER (WHERE u.created_at > NOW() - INTERVAL '30 days')::int AS new_users_30d,
      COUNT(*) FILTER (WHERE u.last_seen_at > NOW() - INTERVAL '7 days')::int AS active_users_7d,
      COUNT(*) FILTER (WHERE u.last_seen_at > NOW() - INTERVAL '30 days')::int AS active_users_30d,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM items i
        WHERE i.user_id = u.id
        GROUP BY i.shelf_id
        HAVING COUNT(*) >= ${ACTIVATION_ITEM_THRESHOLD}
      ))::int AS activated_users
    FROM users u
  `;

  return result[0] as AdminOverview;
}

/**
 * Signups per week, split by auth method. Users created before signup_source
 * was tracked are classified by which credential they have.
 */
export async function getAdminWeeklySignups(weeks: number = 12): Promise<AdminWeeklySignups[]> {
  const result = await sql`
    WITH signups AS (
      SELECT
        date_trunc('week', created_at) AS week,
        COALESCE(signup_source, CASE WHEN password_hash IS NULL THEN 'google' ELSE 'email' END) AS method
      FROM users
      WHERE created_at > date_trunc('week', NOW()) - make_interval(weeks => ${weeks - 1})
    )
    SELECT
      week,
      COUNT(*) FILTER (WHERE method = 'email')::int AS email,
      COUNT(*) FILTER (WHERE method = 'google')::int AS google
    FROM signups
    GROUP BY week
    ORDER BY week ASC
  `;

  return result as AdminWeeklySignups[];
}

/**
 * Signup counts grouped by raw referrer / utm_source over the last `days`.
 * Classification into channels happens in application code.
 */
export async function getAdminAttribution(days: number = 90): Promise<AdminAttributionRow[]> {
  const result = await sql`
    SELECT
      u.signup_source IS NOT NULL AS tracked,
      u.first_referrer,
      u.utm_source,
      -- Read through to_jsonb so this returns NULL, rather than failing, on a
      -- database where migration 008 has not run yet
      to_jsonb(u) ->> 'first_landing_path' AS first_landing_path,
      COUNT(*)::int AS count
    FROM users u
    WHERE u.created_at > NOW() - make_interval(days => ${days})
    GROUP BY 1, 2, 3, 4
    ORDER BY count DESC
  `;

  return result as AdminAttributionRow[];
}

/**
 * Most recent signups with usage stats
 */
export async function getAdminRecentUsers(limit: number = 50): Promise<AdminRecentUser[]> {
  const result = await sql`
    SELECT
      u.id,
      u.username,
      u.email,
      COALESCE(u.signup_source, CASE WHEN u.password_hash IS NULL THEN 'google' ELSE 'email' END) AS signup_method,
      u.signup_source IS NOT NULL AS tracked,
      u.first_referrer,
      u.utm_source,
      to_jsonb(u) ->> 'first_landing_path' AS first_landing_path,
      u.created_at,
      u.last_seen_at,
      (SELECT COUNT(*)::int FROM shelves s WHERE s.user_id = u.id) AS shelf_count,
      (SELECT COUNT(*)::int FROM items i WHERE i.user_id = u.id) AS item_count,
      EXISTS (
        SELECT 1 FROM items i
        WHERE i.user_id = u.id
        GROUP BY i.shelf_id
        HAVING COUNT(*) >= ${ACTIVATION_ITEM_THRESHOLD}
      ) AS activated,
      (
        SELECT s.share_token FROM shelves s
        WHERE s.user_id = u.id AND s.is_public = true
        ORDER BY s.updated_at DESC
        LIMIT 1
      ) AS public_share_token
    FROM users u
    ORDER BY u.created_at DESC
    LIMIT ${limit}
  `;

  return result as AdminRecentUser[];
}

/**
 * Add one view to today's counter for a public shelf. Private or unknown
 * tokens match no shelf, so nothing is written. embed_host must be '' for
 * surface = 'shelf'.
 */
export async function recordShelfView(
  shareToken: string,
  surface: ViewSurface,
  embedHost: string = ''
): Promise<void> {
  await sql`
    INSERT INTO shelf_view_daily (shelf_id, day, surface, embed_host, views)
    SELECT id, CURRENT_DATE, ${surface}, ${embedHost}, 1
    FROM shelves
    WHERE share_token = ${shareToken} AND is_public = true
    ON CONFLICT (shelf_id, day, surface, embed_host)
    DO UPDATE SET views = shelf_view_daily.views + 1
  `;
}

/**
 * Views per week over the last `weeks` weeks, split into shelf page and embed views
 */
export async function getAdminViewStats(weeks: number = 12): Promise<AdminWeeklyViews[]> {
  const result = await sql`
    SELECT
      date_trunc('week', day) AS week,
      COALESCE(SUM(views) FILTER (WHERE surface = 'shelf'), 0)::int AS shelf,
      COALESCE(SUM(views) FILTER (WHERE surface = 'embed'), 0)::int AS embed
    FROM shelf_view_daily
    WHERE day >= date_trunc('week', CURRENT_DATE) - make_interval(weeks => ${weeks - 1})
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  return result as AdminWeeklyViews[];
}

/**
 * Most-viewed shelves over the last `days` days, with owner and share link
 */
export async function getAdminTopShelves(days: number = 30, limit: number = 10): Promise<AdminTopShelf[]> {
  const result = await sql`
    SELECT
      s.id AS shelf_id,
      s.name,
      s.share_token,
      s.is_public,
      u.username AS owner_username,
      COALESCE(SUM(v.views) FILTER (WHERE v.surface = 'shelf'), 0)::int AS shelf_views,
      COALESCE(SUM(v.views) FILTER (WHERE v.surface = 'embed'), 0)::int AS embed_views,
      SUM(v.views)::int AS views
    FROM shelf_view_daily v
    JOIN shelves s ON s.id = v.shelf_id
    JOIN users u ON u.id = s.user_id
    WHERE v.day > CURRENT_DATE - ${days}::int
    GROUP BY s.id, u.username
    ORDER BY views DESC
    LIMIT ${limit}
  `;

  return result as AdminTopShelf[];
}

/**
 * View counts for every shelf a user owns, keyed by shelf id (issue #68).
 *
 * Shelves that have never been viewed are simply absent from the map. Reads
 * the same daily counters as the admin dashboard, scoped to one owner.
 */
export async function getShelfViewsForOwner(userId: string): Promise<Map<string, ShelfViewSummary>> {
  const [totals, hosts] = await Promise.all([
    sql`
      SELECT
        v.shelf_id,
        COALESCE(SUM(v.views) FILTER (WHERE v.day > CURRENT_DATE - 7), 0)::int AS views_7d,
        SUM(v.views)::int AS views_total
      FROM shelf_view_daily v
      JOIN shelves s ON s.id = v.shelf_id
      WHERE s.user_id = ${userId}
      GROUP BY v.shelf_id
    `,
    // The busiest embedding site per shelf over the last 30 days
    sql`
      SELECT DISTINCT ON (v.shelf_id)
        v.shelf_id,
        v.embed_host,
        SUM(v.views)::int AS views
      FROM shelf_view_daily v
      JOIN shelves s ON s.id = v.shelf_id
      WHERE s.user_id = ${userId}
        AND v.surface = 'embed'
        AND v.embed_host <> ''
        AND v.day > CURRENT_DATE - 30
      GROUP BY v.shelf_id, v.embed_host
      ORDER BY v.shelf_id, SUM(v.views) DESC
    `,
  ]);

  const summary = new Map<string, ShelfViewSummary>();
  for (const row of totals as { shelf_id: string; views_7d: number; views_total: number }[]) {
    summary.set(row.shelf_id, {
      views_7d: row.views_7d,
      views_total: row.views_total,
      top_embed_host: null,
      top_embed_host_views: 0,
    });
  }
  for (const row of hosts as { shelf_id: string; embed_host: string; views: number }[]) {
    const entry = summary.get(row.shelf_id);
    if (entry) {
      entry.top_embed_host = row.embed_host;
      entry.top_embed_host_views = row.views;
    }
  }
  return summary;
}

/**
 * Sites embedding shelves over the last `days` days, by embed views
 */
export async function getAdminEmbedHosts(days: number = 30, limit: number = 10): Promise<AdminEmbedHost[]> {
  const result = await sql`
    SELECT
      embed_host,
      COUNT(DISTINCT shelf_id)::int AS shelf_count,
      SUM(views)::int AS views
    FROM shelf_view_daily
    WHERE surface = 'embed' AND embed_host <> '' AND day > CURRENT_DATE - ${days}::int
    GROUP BY embed_host
    ORDER BY views DESC
    LIMIT ${limit}
  `;

  return result as AdminEmbedHost[];
}
