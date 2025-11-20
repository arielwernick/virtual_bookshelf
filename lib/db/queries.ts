import { sql } from './client';
import { User, Item, CreateItemData, UpdateItemData } from '../types/shelf';

/**
 * Create a new user
 */
export async function createUser(username: string, passwordHash: string): Promise<User> {
  const result = await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
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
 * Get user by share token
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
 * Create a new item
 */
export async function createItem(userId: string, itemData: CreateItemData): Promise<Item> {
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
    INSERT INTO items (user_id, type, title, creator, image_url, external_url, notes, order_index)
    VALUES (${userId}, ${type}, ${title}, ${creator}, ${image_url}, ${external_url}, ${notes}, ${order_index})
    RETURNING *
  `;
  
  return result[0] as Item;
}

/**
 * Get all items for a user
 */
export async function getItemsByUserId(userId: string): Promise<Item[]> {
  const result = await sql`
    SELECT * FROM items
    WHERE user_id = ${userId}
    ORDER BY order_index ASC, created_at DESC
  `;
  
  return result as Item[];
}

/**
 * Get items by user ID and type
 */
export async function getItemsByUserIdAndType(userId: string, type: string): Promise<Item[]> {
  const result = await sql`
    SELECT * FROM items
    WHERE user_id = ${userId} AND type = ${type}
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
 * Update an item
 */
export async function updateItem(itemId: string, itemData: UpdateItemData): Promise<Item> {
  // Build SET clause dynamically
  const setClauses: string[] = [];
  const setValues: any = {};

  if (itemData.title !== undefined) {
    setClauses.push('title = ' + sql`${itemData.title}`);
  }
  if (itemData.creator !== undefined) {
    setClauses.push('creator = ' + sql`${itemData.creator}`);
  }
  if (itemData.image_url !== undefined) {
    setClauses.push('image_url = ' + sql`${itemData.image_url}`);
  }
  if (itemData.external_url !== undefined) {
    setClauses.push('external_url = ' + sql`${itemData.external_url}`);
  }
  if (itemData.notes !== undefined) {
    setClauses.push('notes = ' + sql`${itemData.notes}`);
  }
  if (itemData.order_index !== undefined) {
    setClauses.push('order_index = ' + sql`${itemData.order_index}`);
  }

  if (setClauses.length === 0) {
    throw new Error('No fields to update');
  }

  // Simple approach: update fields individually
  let result: any;
  
  if (itemData.title !== undefined) {
    result = await sql`UPDATE items SET title = ${itemData.title} WHERE id = ${itemId} RETURNING *`;
  }
  if (itemData.creator !== undefined) {
    result = await sql`UPDATE items SET creator = ${itemData.creator} WHERE id = ${itemId} RETURNING *`;
  }
  if (itemData.image_url !== undefined) {
    result = await sql`UPDATE items SET image_url = ${itemData.image_url} WHERE id = ${itemId} RETURNING *`;
  }
  if (itemData.external_url !== undefined) {
    result = await sql`UPDATE items SET external_url = ${itemData.external_url} WHERE id = ${itemId} RETURNING *`;
  }
  if (itemData.notes !== undefined) {
    result = await sql`UPDATE items SET notes = ${itemData.notes} WHERE id = ${itemId} RETURNING *`;
  }
  if (itemData.order_index !== undefined) {
    result = await sql`UPDATE items SET order_index = ${itemData.order_index} WHERE id = ${itemId} RETURNING *`;
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
 * Update item order for a user (batch reorder)
 */
export async function updateItemOrder(userId: string, itemIds: string[]): Promise<void> {
  // Update items sequentially (Neon doesn't support transactions in the same way)
  for (let i = 0; i < itemIds.length; i++) {
    await sql`
      UPDATE items
      SET order_index = ${i}
      WHERE id = ${itemIds[i]} AND user_id = ${userId}
    `;
  }
}

/**
 * Get the next order index for a user
 */
export async function getNextOrderIndex(userId: string): Promise<number> {
  const result = await sql`
    SELECT COALESCE(MAX(order_index), -1) + 1 as next_index
    FROM items
    WHERE user_id = ${userId}
  `;
  
  return result[0].next_index as number;
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
