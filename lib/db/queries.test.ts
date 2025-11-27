/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database client BEFORE importing queries
vi.mock('./client', () => ({
  sql: vi.fn(),
}));

import { sql } from './client';
import {
  // User queries
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  getUserByGoogleId,
  getUserByShareToken,
  updateUserGoogleId,
  updateUserDescription,
  updateUserTitle,
  // Shelf queries
  createShelf,
  getShelfById,
  getShelfByShareToken,
  getShelfsByUserId,
  updateShelf,
  deleteShelf,
  // Item queries
  createItem,
  getItemsByShelfId,
  getItemsByShelfIdAndType,
  getItemById,
  updateItem,
  deleteItem,
  updateItemOrder,
  getNextOrderIndex,
} from './queries';

// ============================================================================
// USER QUERY TESTS
// ============================================================================

describe('User Queries', () => {
  beforeEach(() => {
    vi.mocked(sql).mockReset();
  });

  describe('createUser', () => {
    it('creates user with email and password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashedpassword',
        google_id: null,
      };
      vi.mocked(sql).mockResolvedValueOnce([mockUser]);

      const result = await createUser({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
      });

      expect(result).toEqual(mockUser);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('creates user with Google ID', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'google@example.com',
        username: null,
        password_hash: null,
        google_id: 'google-id-123',
      };
      vi.mocked(sql).mockResolvedValueOnce([mockUser]);

      const result = await createUser({
        email: 'google@example.com',
        googleId: 'google-id-123',
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserByUsername', () => {
    it('returns user when found', async () => {
      const mockUser = { id: 'user-1', username: 'john', email: 'john@example.com' };
      vi.mocked(sql).mockResolvedValueOnce([mockUser]);

      const result = await getUserByUsername('john');

      expect(result).toEqual(mockUser);
    });

    it('returns null when user not found', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await getUserByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('returns user when found', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      vi.mocked(sql).mockResolvedValueOnce([mockUser]);

      const result = await getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('returns null when user not found', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await getUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('returns user when found', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      vi.mocked(sql).mockResolvedValueOnce([mockUser]);

      const result = await getUserById('user-123');

      expect(result).toEqual(mockUser);
    });

    it('returns null when user not found', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByGoogleId', () => {
    it('returns user when found', async () => {
      const mockUser = { id: 'user-1', google_id: 'google-123' };
      vi.mocked(sql).mockResolvedValueOnce([mockUser]);

      const result = await getUserByGoogleId('google-123');

      expect(result).toEqual(mockUser);
    });

    it('returns null when user not found', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await getUserByGoogleId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByShareToken', () => {
    it('returns user when found', async () => {
      const mockUser = { id: 'user-1', share_token: 'abc123' };
      vi.mocked(sql).mockResolvedValueOnce([mockUser]);

      const result = await getUserByShareToken('abc123');

      expect(result).toEqual(mockUser);
    });

    it('returns null when not found', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await getUserByShareToken('invalid');

      expect(result).toBeNull();
    });
  });

  describe('updateUserGoogleId', () => {
    it('updates user with Google ID', async () => {
      const mockUser = { id: 'user-1', google_id: 'new-google-id' };
      vi.mocked(sql).mockResolvedValueOnce([mockUser]);

      const result = await updateUserGoogleId('user-1', 'new-google-id');

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUserDescription', () => {
    it('updates user description', async () => {
      const mockUser = { id: 'user-1', description: 'New description' };
      vi.mocked(sql).mockResolvedValueOnce([mockUser]);

      const result = await updateUserDescription('user-1', 'New description');

      expect(result).toEqual(mockUser);
    });

    it('can clear description with null', async () => {
      const mockUser = { id: 'user-1', description: null };
      vi.mocked(sql).mockResolvedValueOnce([mockUser]);

      const result = await updateUserDescription('user-1', null);

      expect(result.description).toBeNull();
    });
  });

  describe('updateUserTitle', () => {
    it('updates user title', async () => {
      const mockUser = { id: 'user-1', title: 'My Bookshelf' };
      vi.mocked(sql).mockResolvedValueOnce([mockUser]);

      const result = await updateUserTitle('user-1', 'My Bookshelf');

      expect(result).toEqual(mockUser);
    });
  });
});

// ============================================================================
// SHELF QUERY TESTS
// ============================================================================

describe('Shelf Queries', () => {
  beforeEach(() => {
    vi.mocked(sql).mockReset();
  });

  describe('createShelf', () => {
    it('creates shelf with name', async () => {
      const mockShelf = {
        id: 'shelf-1',
        user_id: 'user-1',
        name: 'My Favorites',
        description: null,
      };
      vi.mocked(sql).mockResolvedValueOnce([mockShelf]);

      const result = await createShelf('user-1', 'My Favorites');

      expect(result).toEqual(mockShelf);
    });

    it('creates shelf with description', async () => {
      const mockShelf = {
        id: 'shelf-2',
        user_id: 'user-1',
        name: 'Reading List',
        description: 'Books to read',
      };
      vi.mocked(sql).mockResolvedValueOnce([mockShelf]);

      const result = await createShelf('user-1', 'Reading List', 'Books to read');

      expect(result).toEqual(mockShelf);
    });
  });

  describe('getShelfById', () => {
    it('returns shelf when found', async () => {
      const mockShelf = { id: 'shelf-1', name: 'Test Shelf' };
      vi.mocked(sql).mockResolvedValueOnce([mockShelf]);

      const result = await getShelfById('shelf-1');

      expect(result).toEqual(mockShelf);
    });

    it('returns null when not found', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await getShelfById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getShelfByShareToken', () => {
    it('returns shelf when found', async () => {
      const mockShelf = { id: 'shelf-1', share_token: 'token123' };
      vi.mocked(sql).mockResolvedValueOnce([mockShelf]);

      const result = await getShelfByShareToken('token123');

      expect(result).toEqual(mockShelf);
    });

    it('returns null when not found', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await getShelfByShareToken('invalid');

      expect(result).toBeNull();
    });
  });

  describe('getShelfsByUserId', () => {
    it('returns array of shelves', async () => {
      const mockShelves = [
        { id: 'shelf-1', name: 'Shelf 1' },
        { id: 'shelf-2', name: 'Shelf 2' },
      ];
      vi.mocked(sql).mockResolvedValueOnce(mockShelves);

      const result = await getShelfsByUserId('user-1');

      expect(result).toEqual(mockShelves);
      expect(result).toHaveLength(2);
    });

    it('returns empty array when user has no shelves', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await getShelfsByUserId('user-no-shelves');

      expect(result).toEqual([]);
    });
  });

  describe('updateShelf', () => {
    it('updates shelf name', async () => {
      const mockShelf = { id: 'shelf-1', name: 'Updated Name' };
      vi.mocked(sql).mockResolvedValueOnce([mockShelf]);

      const result = await updateShelf('shelf-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('updates shelf description', async () => {
      const mockShelf = { id: 'shelf-1', description: 'New description' };
      vi.mocked(sql).mockResolvedValueOnce([mockShelf]);

      const result = await updateShelf('shelf-1', { description: 'New description' });

      expect(result.description).toBe('New description');
    });

    it('updates shelf visibility', async () => {
      const mockShelf = { id: 'shelf-1', is_public: true };
      vi.mocked(sql).mockResolvedValueOnce([mockShelf]);

      const result = await updateShelf('shelf-1', { is_public: true });

      expect(result.is_public).toBe(true);
    });

    it('throws error when no fields to update', async () => {
      await expect(updateShelf('shelf-1', {})).rejects.toThrow('No fields to update');
    });
  });

  describe('deleteShelf', () => {
    it('returns true when shelf deleted', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ id: 'shelf-1' }]);

      const result = await deleteShelf('shelf-1');

      expect(result).toBe(true);
    });

    it('returns false when shelf not found', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await deleteShelf('nonexistent');

      expect(result).toBe(false);
    });
  });
});

// ============================================================================
// ITEM QUERY TESTS
// ============================================================================

describe('Item Queries', () => {
  beforeEach(() => {
    vi.mocked(sql).mockReset();
  });

  describe('createItem', () => {
    it('creates item with required fields', async () => {
      const mockItem = {
        id: 'item-1',
        shelf_id: 'shelf-1',
        user_id: 'user-1',
        type: 'book',
        title: 'The Great Gatsby',
        creator: 'F. Scott Fitzgerald',
        order_index: 0,
      };
      vi.mocked(sql).mockResolvedValueOnce([mockItem]);

      const result = await createItem(
        'shelf-1',
        { type: 'book', title: 'The Great Gatsby', creator: 'F. Scott Fitzgerald' },
        'user-1'
      );

      expect(result).toEqual(mockItem);
    });

    it('creates item with optional fields', async () => {
      const mockItem = {
        id: 'item-2',
        shelf_id: 'shelf-1',
        type: 'book',
        title: 'Test Book',
        creator: 'Author',
        image_url: 'https://example.com/image.jpg',
        external_url: 'https://example.com/book',
        notes: 'Great read!',
        order_index: 5,
      };
      vi.mocked(sql).mockResolvedValueOnce([mockItem]);

      const result = await createItem('shelf-1', {
        type: 'book',
        title: 'Test Book',
        creator: 'Author',
        image_url: 'https://example.com/image.jpg',
        external_url: 'https://example.com/book',
        notes: 'Great read!',
        order_index: 5,
      });

      expect(result).toEqual(mockItem);
    });
  });

  describe('getItemsByShelfId', () => {
    it('returns items ordered by order_index', async () => {
      const mockItems = [
        { id: 'item-1', order_index: 0 },
        { id: 'item-2', order_index: 1 },
        { id: 'item-3', order_index: 2 },
      ];
      vi.mocked(sql).mockResolvedValueOnce(mockItems);

      const result = await getItemsByShelfId('shelf-1');

      expect(result).toEqual(mockItems);
      expect(result).toHaveLength(3);
    });

    it('returns empty array for empty shelf', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await getItemsByShelfId('empty-shelf');

      expect(result).toEqual([]);
    });
  });

  describe('getItemsByShelfIdAndType', () => {
    it('returns only items of specified type', async () => {
      const mockBooks = [
        { id: 'book-1', type: 'book' },
        { id: 'book-2', type: 'book' },
      ];
      vi.mocked(sql).mockResolvedValueOnce(mockBooks);

      const result = await getItemsByShelfIdAndType('shelf-1', 'book');

      expect(result).toEqual(mockBooks);
    });
  });

  describe('getItemById', () => {
    it('returns item when found', async () => {
      const mockItem = { id: 'item-1', title: 'Test Item' };
      vi.mocked(sql).mockResolvedValueOnce([mockItem]);

      const result = await getItemById('item-1');

      expect(result).toEqual(mockItem);
    });

    it('returns null when not found', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await getItemById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateItem', () => {
    it('updates item title', async () => {
      const mockItem = { id: 'item-1', title: 'New Title' };
      vi.mocked(sql).mockResolvedValueOnce([mockItem]);

      const result = await updateItem('item-1', { title: 'New Title' });

      expect(result.title).toBe('New Title');
    });

    it('updates item creator', async () => {
      const mockItem = { id: 'item-1', creator: 'New Author' };
      vi.mocked(sql).mockResolvedValueOnce([mockItem]);

      const result = await updateItem('item-1', { creator: 'New Author' });

      expect(result.creator).toBe('New Author');
    });

    it('updates item notes', async () => {
      const mockItem = { id: 'item-1', notes: 'Updated notes' };
      vi.mocked(sql).mockResolvedValueOnce([mockItem]);

      const result = await updateItem('item-1', { notes: 'Updated notes' });

      expect(result.notes).toBe('Updated notes');
    });

    it('updates item order_index', async () => {
      const mockItem = { id: 'item-1', order_index: 5 };
      vi.mocked(sql).mockResolvedValueOnce([mockItem]);

      const result = await updateItem('item-1', { order_index: 5 });

      expect(result.order_index).toBe(5);
    });
  });

  describe('deleteItem', () => {
    it('returns true when item deleted', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ id: 'item-1' }]);

      const result = await deleteItem('item-1');

      expect(result).toBe(true);
    });

    it('returns false when item not found', async () => {
      vi.mocked(sql).mockResolvedValueOnce([]);

      const result = await deleteItem('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('updateItemOrder', () => {
    it('updates order for multiple items', async () => {
      vi.mocked(sql).mockResolvedValue([{ id: 'item' }]);

      await updateItemOrder('shelf-1', ['item-3', 'item-1', 'item-2']);

      // Should call sql 3 times (once per item)
      expect(sql).toHaveBeenCalledTimes(3);
    });
  });

  describe('getNextOrderIndex', () => {
    it('returns next order index', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ next_index: 5 }]);

      const result = await getNextOrderIndex('shelf-1');

      expect(result).toBe(5);
    });

    it('returns 0 for empty shelf', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ next_index: 0 }]);

      const result = await getNextOrderIndex('empty-shelf');

      expect(result).toBe(0);
    });
  });
});
