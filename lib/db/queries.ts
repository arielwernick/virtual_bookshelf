import { sql } from './client';
import { User, Item, Shelf, CreateItemData, UpdateItemData, ShelfType } from '../types/shelf';
import { generateShortToken } from '../utils/token';

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
  description?: string | null,
  shelfType: ShelfType = 'standard'
): Promise<Shelf> {
  const shareToken = generateShortToken();
  
  const result = await sql`
    INSERT INTO shelves (user_id, name, description, shelf_type, share_token)
    VALUES (${userId}, ${name}, ${description || null}, ${shelfType}, ${shareToken})
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
 * Update shelf
 */
export async function updateShelf(
  shelfId: string,
  data: Partial<Shelf>
): Promise<Shelf> {
  const setClauses: string[] = [];
  const values: Record<string, string | boolean | null> = {};

  if (data.name !== undefined) {
    setClauses.push('name = $1');
    values.name = data.name;
  }
  if (data.description !== undefined) {
    setClauses.push('description = $2');
    values.description = data.description;
  }
  if (data.is_public !== undefined) {
    setClauses.push('is_public = $3');
    values.is_public = data.is_public;
  }

  if (setClauses.length === 0) {
    throw new Error('No fields to update');
  }

  // Simple approach: update one field at a time
  let result: Shelf[] = [];

  if (data.name !== undefined) {
    result = await sql`UPDATE shelves SET name = ${data.name} WHERE id = ${shelfId} RETURNING *` as Shelf[];
  }
  if (data.description !== undefined) {
    result = await sql`UPDATE shelves SET description = ${data.description} WHERE id = ${shelfId} RETURNING *` as Shelf[];
  }
  if (data.is_public !== undefined) {
    result = await sql`UPDATE shelves SET is_public = ${data.is_public} WHERE id = ${shelfId} RETURNING *` as Shelf[];
  }

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
    order_index = 0,
  } = itemData;

  const result = await sql`
    INSERT INTO items (shelf_id, user_id, type, title, creator, image_url, external_url, notes, order_index)
    VALUES (${shelfId}, ${userId || null}, ${type}, ${title}, ${creator}, ${image_url}, ${external_url}, ${notes}, ${order_index})
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
 * Get all items for a user (across all shelves)
 * @deprecated Use getItemsByShelfId instead
 */
export async function getItemsByUserId(userId: string): Promise<Item[]> {
  const result = await sql`
    SELECT items.* FROM items
    JOIN shelves ON items.shelf_id = shelves.id
    WHERE shelves.user_id = ${userId}
    ORDER BY items.created_at DESC
  `;

  return result as Item[];
}

/**
 * Get items by user ID and type (across all shelves)
 * @deprecated Use getItemsByShelfIdAndType instead
 */
export async function getItemsByUserIdAndType(userId: string, type: string): Promise<Item[]> {
  const result = await sql`
    SELECT items.* FROM items
    JOIN shelves ON items.shelf_id = shelves.id
    WHERE shelves.user_id = ${userId} AND items.type = ${type}
    ORDER BY items.created_at DESC
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
 * Update an item
 */
export async function updateItem(itemId: string, itemData: UpdateItemData): Promise<Item> {
  let result: Item[] = [];

  if (itemData.title !== undefined) {
    result = await sql`UPDATE items SET title = ${itemData.title} WHERE id = ${itemId} RETURNING *` as Item[];
  }
  if (itemData.creator !== undefined) {
    result = await sql`UPDATE items SET creator = ${itemData.creator} WHERE id = ${itemId} RETURNING *` as Item[];
  }
  if (itemData.image_url !== undefined) {
    result = await sql`UPDATE items SET image_url = ${itemData.image_url} WHERE id = ${itemId} RETURNING *` as Item[];
  }
  if (itemData.external_url !== undefined) {
    result = await sql`UPDATE items SET external_url = ${itemData.external_url} WHERE id = ${itemId} RETURNING *` as Item[];
  }
  if (itemData.notes !== undefined) {
    result = await sql`UPDATE items SET notes = ${itemData.notes} WHERE id = ${itemId} RETURNING *` as Item[];
  }
  if (itemData.order_index !== undefined) {
    result = await sql`UPDATE items SET order_index = ${itemData.order_index} WHERE id = ${itemId} RETURNING *` as Item[];
  }

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
