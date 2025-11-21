import { sql } from './client';
import { User, Shelf, Item, CreateShelfData, CreateItemData, UpdateItemData, UpdateShelfData } from '../types/shelf';

/**
 * Create a new user account
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

// ============================================================================
// SHELF OPERATIONS
// ============================================================================

/**
 * Create a new shelf for a user
 */
export async function createShelf(userId: string, shelfData: CreateShelfData): Promise<Shelf> {
    const { name, description = null, is_default = false } = shelfData;
    
    const result = await sql`
    INSERT INTO shelves (user_id, name, description, is_default)
    VALUES (${userId}, ${name}, ${description}, ${is_default})
    RETURNING *
  `;

    return result[0] as Shelf;
}

/**
 * Get a shelf by ID
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
 * Get all shelves for a user
 */
export async function getShelvesByUserId(userId: string): Promise<Shelf[]> {
    const result = await sql`
    SELECT * FROM shelves
    WHERE user_id = ${userId}
    ORDER BY is_default DESC, created_at ASC
  `;

    return result as Shelf[];
}

/**
 * Get user's default shelf
 */
export async function getDefaultShelf(userId: string): Promise<Shelf | null> {
    const result = await sql`
    SELECT * FROM shelves
    WHERE user_id = ${userId} AND is_default = true
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
 * Get shelf by user ID and shelf name
 */
export async function getShelfByUserAndName(userId: string, name: string): Promise<Shelf | null> {
    const result = await sql`
    SELECT * FROM shelves
    WHERE user_id = ${userId} AND name = ${name}
    LIMIT 1
  `;

    return result.length > 0 ? (result[0] as Shelf) : null;
}

/**
 * Update a shelf
 */
export async function updateShelf(shelfId: string, shelfData: UpdateShelfData): Promise<Shelf> {
    if (shelfData.name !== undefined) {
        const result = await sql`
      UPDATE shelves 
      SET name = ${shelfData.name}
      WHERE id = ${shelfId}
      RETURNING *
    `;
        return result[0] as Shelf;
    }

    if (shelfData.description !== undefined) {
        const result = await sql`
      UPDATE shelves 
      SET description = ${shelfData.description}
      WHERE id = ${shelfId}
      RETURNING *
    `;
        return result[0] as Shelf;
    }

    throw new Error('No fields to update');
}

/**
 * Delete a shelf (and all its items via CASCADE)
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
// ITEM OPERATIONS
// ============================================================================

/**
 * Create a new item in a shelf
 */
export async function createItem(shelfId: string, itemData: CreateItemData): Promise<Item> {
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
    INSERT INTO items (shelf_id, type, title, creator, image_url, external_url, notes, order_index)
    VALUES (${shelfId}, ${type}, ${title}, ${creator}, ${image_url}, ${external_url}, ${notes}, ${order_index})
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
 * Update an item
 */
export async function updateItem(itemId: string, itemData: UpdateItemData): Promise<Item> {
    // Simple approach: update fields individually
    let result: Item | undefined;

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
        const res = await sql`UPDATE items SET order_index = ${itemData.order_index} WHERE id = ${itemId} RETURNING *`;
        result = res[0] as Item;
    }

    if (!result) {
        throw new Error('No fields to update');
    }

    return result;
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
 */
export async function updateItemOrder(shelfId: string, itemIds: string[]): Promise<void> {
    // Update items sequentially (Neon doesn't support transactions in the same way)
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
