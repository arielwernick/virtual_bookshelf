import { sql, sqlQuery } from './client';
import { User, Item, Shelf, CreateItemData, UpdateItemData, ShelfWithItems } from '../types/shelf';
import { generateShortToken } from '../utils/token';

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
