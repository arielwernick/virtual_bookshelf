/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, DELETE } from './route';
import { Item, Shelf, ShelfType } from '@/lib/types/shelf';

// Mock dependencies
vi.mock('@/lib/utils/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  getItemById: vi.fn(),
  getShelfById: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

import { getSession } from '@/lib/utils/session';
import { getItemById, getShelfById, updateItem, deleteItem } from '@/lib/db/queries';

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

// Helper to create request with params
function createPatchRequest(body: object): Request {
  return new Request('http://localhost:3000/api/items/item-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createDeleteRequest(): Request {
  return new Request('http://localhost:3000/api/items/item-1', {
    method: 'DELETE',
  });
}

describe('PATCH /api/items/[id]', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getItemById).mockReset();
    vi.mocked(getShelfById).mockReset();
    vi.mocked(updateItem).mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const req = createPatchRequest({ title: 'New Title' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not authenticated');
    });

    it('returns 401 when session has no userId', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: '', username: 'test' });

      const req = createPatchRequest({ title: 'New Title' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });

      expect(res.status).toBe(401);
    });
  });

  describe('Item Not Found', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('returns 404 when item does not exist', async () => {
      vi.mocked(getItemById).mockResolvedValue(null);

      const req = createPatchRequest({ title: 'New Title' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Item not found');
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('returns 403 when user does not own the shelf', async () => {
      vi.mocked(getItemById).mockResolvedValue(createMockItem({ shelf_id: 'shelf-1' }));
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ user_id: 'different-user' }));

      const req = createPatchRequest({ title: 'New Title' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 403 when shelf not found', async () => {
      vi.mocked(getItemById).mockResolvedValue(createMockItem());
      vi.mocked(getShelfById).mockResolvedValue(null);

      const req = createPatchRequest({ title: 'New Title' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });

      expect(res.status).toBe(403);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getItemById).mockResolvedValue(createMockItem());
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
    });

    it('returns 400 for empty title', async () => {
      const req = createPatchRequest({ title: '' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Title');
    });

    it('returns 400 for empty creator', async () => {
      const req = createPatchRequest({ creator: '' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Creator');
    });

    it('returns 400 for invalid image URL', async () => {
      const req = createPatchRequest({ image_url: 'not-a-url' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('URL');
    });

    it('returns 400 for invalid external URL', async () => {
      const req = createPatchRequest({ external_url: 'invalid' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('URL');
    });

    it('returns 400 for invalid rating', async () => {
      const req = createPatchRequest({ rating: 6 }); // Max is 5

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Rating');
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getItemById).mockResolvedValue(createMockItem());
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
    });

    it('updates item title', async () => {
      const updatedItem = createMockItem({ title: 'Updated Title' });
      vi.mocked(updateItem).mockResolvedValue(updatedItem);

      const req = createPatchRequest({ title: 'Updated Title' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Updated Title');
      expect(updateItem).toHaveBeenCalledWith('item-1', { title: 'Updated Title' });
    });

    it('updates multiple fields at once', async () => {
      const updatedItem = createMockItem({
        title: 'New Title',
        creator: 'New Author',
        notes: 'Great book!',
      });
      vi.mocked(updateItem).mockResolvedValue(updatedItem);

      const req = createPatchRequest({
        title: 'New Title',
        creator: 'New Author',
        notes: 'Great book!',
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(updateItem).toHaveBeenCalledWith('item-1', {
        title: 'New Title',
        creator: 'New Author',
        notes: 'Great book!',
      });
    });

    it('updates image URL', async () => {
      const updatedItem = createMockItem({ image_url: 'https://example.com/image.jpg' });
      vi.mocked(updateItem).mockResolvedValue(updatedItem);

      const req = createPatchRequest({ image_url: 'https://example.com/image.jpg' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });

      expect(res.status).toBe(200);
      expect(updateItem).toHaveBeenCalledWith('item-1', {
        image_url: 'https://example.com/image.jpg',
      });
    });

    it('clears image URL with null', async () => {
      const updatedItem = createMockItem({ image_url: null });
      vi.mocked(updateItem).mockResolvedValue(updatedItem);

      const req = createPatchRequest({ image_url: null });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });

      expect(res.status).toBe(200);
      expect(updateItem).toHaveBeenCalledWith('item-1', { image_url: null });
    });

    it('updates rating', async () => {
      const updatedItem = createMockItem({ rating: 5 });
      vi.mocked(updateItem).mockResolvedValue(updatedItem);

      const req = createPatchRequest({ rating: 5 });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });

      expect(res.status).toBe(200);
      expect(updateItem).toHaveBeenCalledWith('item-1', { rating: 5 });
    });

    it('updates order index', async () => {
      const updatedItem = createMockItem({ order_index: 3 });
      vi.mocked(updateItem).mockResolvedValue(updatedItem);

      const req = createPatchRequest({ order_index: 3 });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });

      expect(res.status).toBe(200);
      expect(updateItem).toHaveBeenCalledWith('item-1', { order_index: 3 });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getItemById).mockResolvedValue(createMockItem());
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
    });

    it('returns 500 when update fails', async () => {
      vi.mocked(updateItem).mockRejectedValue(new Error('Database error'));

      const req = createPatchRequest({ title: 'New Title' });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to update item');
    });
  });
});

describe('DELETE /api/items/[id]', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getItemById).mockReset();
    vi.mocked(getShelfById).mockReset();
    vi.mocked(deleteItem).mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const req = createDeleteRequest();

      const res = await DELETE(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not authenticated');
    });

    it('returns 401 when session has no userId', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: '', username: 'test' });

      const req = createDeleteRequest();

      const res = await DELETE(req, { params: Promise.resolve({ id: 'item-1' }) });

      expect(res.status).toBe(401);
    });
  });

  describe('Item Not Found', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('returns 404 when item does not exist', async () => {
      vi.mocked(getItemById).mockResolvedValue(null);

      const req = createDeleteRequest();

      const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Item not found');
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('returns 403 when user does not own the shelf', async () => {
      vi.mocked(getItemById).mockResolvedValue(createMockItem());
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ user_id: 'different-user' }));

      const req = createDeleteRequest();

      const res = await DELETE(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 403 when shelf not found', async () => {
      vi.mocked(getItemById).mockResolvedValue(createMockItem());
      vi.mocked(getShelfById).mockResolvedValue(null);

      const req = createDeleteRequest();

      const res = await DELETE(req, { params: Promise.resolve({ id: 'item-1' }) });

      expect(res.status).toBe(403);
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getItemById).mockResolvedValue(createMockItem());
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
    });

    it('deletes item successfully', async () => {
      vi.mocked(deleteItem).mockResolvedValue(undefined);

      const req = createDeleteRequest();

      const res = await DELETE(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Item deleted successfully');
      expect(deleteItem).toHaveBeenCalledWith('item-1');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getItemById).mockResolvedValue(createMockItem());
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
    });

    it('returns 500 when delete fails', async () => {
      vi.mocked(deleteItem).mockRejectedValue(new Error('Database error'));

      const req = createDeleteRequest();

      const res = await DELETE(req, { params: Promise.resolve({ id: 'item-1' }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to delete item');
    });
  });
});
