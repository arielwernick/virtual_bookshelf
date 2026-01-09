/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { Item, Shelf, ShelfType } from '@/lib/types/shelf';

// Mock dependencies
vi.mock('@/lib/utils/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  getShelfById: vi.fn(),
  getItemById: vi.fn(),
  updateItemOrder: vi.fn(),
}));

import { getSession } from '@/lib/utils/session';
import { getShelfById, getItemById, updateItemOrder } from '@/lib/db/queries';

// Helper to create mock item
function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    type: 'book',
    title: 'Test Book',
    creator: 'Test Author',
    image_url: null,
    external_url: null,
    notes: null,
    order_index: 0,
    rating: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

// Helper to create mock shelf
function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'Test Shelf',
    description: null,
    share_token: 'token',
    is_public: false,
    shelf_type: 'standard' as ShelfType,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

// Helper to create request
function createRequest(body: object): Request {
  return new Request('http://localhost:3000/api/items/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/items/reorder', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getShelfById).mockReset();
    vi.mocked(getItemById).mockReset();
    vi.mocked(updateItemOrder).mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: ['item-1', 'item-2'],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not authenticated');
    });

    it('returns 401 when session has no userId', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: '', username: 'test' });

      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: ['item-1', 'item-2'],
      });

      const res = await POST(req);

      expect(res.status).toBe(401);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('returns 400 when shelf_id is missing', async () => {
      const req = createRequest({
        item_ids: ['item-1', 'item-2'],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Shelf ID is required');
    });

    it('returns 400 when shelf_id is not a string', async () => {
      const req = createRequest({
        shelf_id: 123,
        item_ids: ['item-1', 'item-2'],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Shelf ID is required');
    });

    it('returns 400 when item_ids is not an array', async () => {
      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: 'not-an-array',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('item_ids must be an array');
    });

    it('returns 400 when item_ids is missing', async () => {
      const req = createRequest({
        shelf_id: 'shelf-1',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('item_ids must be an array');
    });
  });

  describe('Shelf Not Found', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('returns 404 when shelf does not exist', async () => {
      vi.mocked(getShelfById).mockResolvedValue(null);

      const req = createRequest({
        shelf_id: 'nonexistent',
        item_ids: ['item-1', 'item-2'],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Shelf not found');
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('returns 403 when user does not own the shelf', async () => {
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ user_id: 'different-user' }));

      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: ['item-1', 'item-2'],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain('Unauthorized');
    });

    it('returns 403 when item does not belong to shelf', async () => {
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
      vi.mocked(getItemById)
        .mockResolvedValueOnce(createMockItem({ id: 'item-1', shelf_id: 'shelf-1' }))
        .mockResolvedValueOnce(createMockItem({ id: 'item-2', shelf_id: 'different-shelf' }));

      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: ['item-1', 'item-2'],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain('does not belong to this shelf');
    });

    it('returns 403 when item does not exist', async () => {
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
      vi.mocked(getItemById)
        .mockResolvedValueOnce(createMockItem({ id: 'item-1', shelf_id: 'shelf-1' }))
        .mockResolvedValueOnce(null);

      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: ['item-1', 'item-2'],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain('does not belong to this shelf');
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
    });

    it('reorders items successfully', async () => {
      vi.mocked(getItemById)
        .mockResolvedValueOnce(createMockItem({ id: 'item-1', shelf_id: 'shelf-1' }))
        .mockResolvedValueOnce(createMockItem({ id: 'item-2', shelf_id: 'shelf-1' }))
        .mockResolvedValueOnce(createMockItem({ id: 'item-3', shelf_id: 'shelf-1' }));
      vi.mocked(updateItemOrder).mockResolvedValue(undefined);

      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: ['item-3', 'item-1', 'item-2'],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Items reordered successfully');
      expect(updateItemOrder).toHaveBeenCalledWith('shelf-1', ['item-3', 'item-1', 'item-2']);
    });

    it('handles empty item_ids array', async () => {
      vi.mocked(updateItemOrder).mockResolvedValue(undefined);

      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: [],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateItemOrder).toHaveBeenCalledWith('shelf-1', []);
    });

    it('handles single item', async () => {
      vi.mocked(getItemById).mockResolvedValue(createMockItem({ id: 'item-1', shelf_id: 'shelf-1' }));
      vi.mocked(updateItemOrder).mockResolvedValue(undefined);

      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: ['item-1'],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('verifies all items belong to the shelf', async () => {
      vi.mocked(getItemById)
        .mockResolvedValueOnce(createMockItem({ id: 'item-1', shelf_id: 'shelf-1' }))
        .mockResolvedValueOnce(createMockItem({ id: 'item-2', shelf_id: 'shelf-1' }));
      vi.mocked(updateItemOrder).mockResolvedValue(undefined);

      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: ['item-1', 'item-2'],
      });

      await POST(req);

      expect(getItemById).toHaveBeenCalledWith('item-1');
      expect(getItemById).toHaveBeenCalledWith('item-2');
      expect(getItemById).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
    });

    it('returns 500 when updateItemOrder fails', async () => {
      vi.mocked(getItemById).mockResolvedValue(createMockItem({ shelf_id: 'shelf-1' }));
      vi.mocked(updateItemOrder).mockRejectedValue(new Error('Database error'));

      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: ['item-1'],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to reorder items');
    });

    it('returns 500 when getItemById fails', async () => {
      vi.mocked(getItemById).mockRejectedValue(new Error('Database error'));

      const req = createRequest({
        shelf_id: 'shelf-1',
        item_ids: ['item-1'],
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to reorder items');
    });
  });
});
