/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { Shelf, Item, ShelfType } from '@/lib/types/shelf';

// Mock dependencies
vi.mock('@/lib/utils/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  getShelfsByUserId: vi.fn(),
  getItemsByShelfId: vi.fn(),
}));

import { getSession } from '@/lib/utils/session';
import { getShelfsByUserId, getItemsByShelfId } from '@/lib/db/queries';

// Helper to create mock shelf
function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'Test Shelf',
    description: null,
    share_token: 'token123',
    is_public: false,
    shelf_type: 'standard' as ShelfType,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides,
  };
}

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

describe('GET /api/shelf/dashboard', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getShelfsByUserId).mockReset();
    vi.mocked(getItemsByShelfId).mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/shelf/dashboard');

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('returns 401 when session has no userId', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: '', username: 'test' });

      const req = new Request('http://localhost:3000/api/shelf/dashboard');

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ 
        userId: 'user-1', 
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('returns empty shelves array when user has no shelves', async () => {
      vi.mocked(getShelfsByUserId).mockResolvedValue([]);

      const req = new Request('http://localhost:3000/api/shelf/dashboard');

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.shelves).toEqual([]);
      expect(data.data.user_id).toBe('user-1');
      expect(data.data.username).toBe('testuser');
    });

    it('returns shelf with item count', async () => {
      const shelf = createMockShelf();
      const items = [
        createMockItem({ id: 'item-1' }),
        createMockItem({ id: 'item-2' }),
      ];

      vi.mocked(getShelfsByUserId).mockResolvedValue([shelf]);
      vi.mocked(getItemsByShelfId).mockResolvedValue(items);

      const req = new Request('http://localhost:3000/api/shelf/dashboard');

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.shelves).toHaveLength(1);
      expect(data.data.shelves[0].item_count).toBe(2);
      expect(data.data.shelves[0].id).toBe('shelf-1');
      expect(data.data.shelves[0].name).toBe('Test Shelf');
    });

    it('returns multiple shelves with correct item counts', async () => {
      const shelf1 = createMockShelf({ id: 'shelf-1', name: 'Books' });
      const shelf2 = createMockShelf({ id: 'shelf-2', name: 'Podcasts' });

      const items1 = [createMockItem({ id: 'item-1' })];
      const items2 = [
        createMockItem({ id: 'item-2' }),
        createMockItem({ id: 'item-3' }),
        createMockItem({ id: 'item-4' }),
      ];

      vi.mocked(getShelfsByUserId).mockResolvedValue([shelf1, shelf2]);
      vi.mocked(getItemsByShelfId)
        .mockResolvedValueOnce(items1)
        .mockResolvedValueOnce(items2);

      const req = new Request('http://localhost:3000/api/shelf/dashboard');

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.shelves).toHaveLength(2);
      expect(data.data.shelves[0].item_count).toBe(1);
      expect(data.data.shelves[1].item_count).toBe(3);
    });

    it('includes shelf metadata in response', async () => {
      const shelf = createMockShelf({
        name: 'My Books',
        description: 'Favorite reads',
        is_public: true,
      });

      vi.mocked(getShelfsByUserId).mockResolvedValue([shelf]);
      vi.mocked(getItemsByShelfId).mockResolvedValue([]);

      const req = new Request('http://localhost:3000/api/shelf/dashboard');

      const res = await GET(req);
      const data = await res.json();

      expect(data.data.shelves[0]).toMatchObject({
        id: 'shelf-1',
        name: 'My Books',
        description: 'Favorite reads',
        is_public: true,
        share_token: 'token123',
        item_count: 0,
      });
    });

    it('includes user info in response', async () => {
      vi.mocked(getShelfsByUserId).mockResolvedValue([]);

      const req = new Request('http://localhost:3000/api/shelf/dashboard');

      const res = await GET(req);
      const data = await res.json();

      expect(data.data.user_id).toBe('user-1');
      expect(data.data.username).toBe('testuser');
      expect(data.data.email).toBe('test@example.com');
    });

    it('returns shelf with zero items correctly', async () => {
      const shelf = createMockShelf();
      vi.mocked(getShelfsByUserId).mockResolvedValue([shelf]);
      vi.mocked(getItemsByShelfId).mockResolvedValue([]);

      const req = new Request('http://localhost:3000/api/shelf/dashboard');

      const res = await GET(req);
      const data = await res.json();

      expect(data.data.shelves[0].item_count).toBe(0);
    });

    it('includes created_at and updated_at timestamps', async () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-02T00:00:00Z');
      const shelf = createMockShelf({ created_at: createdAt, updated_at: updatedAt });

      vi.mocked(getShelfsByUserId).mockResolvedValue([shelf]);
      vi.mocked(getItemsByShelfId).mockResolvedValue([]);

      const req = new Request('http://localhost:3000/api/shelf/dashboard');

      const res = await GET(req);
      const data = await res.json();

      expect(data.data.shelves[0].created_at).toBeDefined();
      expect(data.data.shelves[0].updated_at).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ 
        userId: 'user-1', 
        username: 'testuser' 
      });
    });

    it('returns 500 when getShelfsByUserId fails', async () => {
      vi.mocked(getShelfsByUserId).mockRejectedValue(new Error('Database error'));

      const req = new Request('http://localhost:3000/api/shelf/dashboard');

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch dashboard');
    });

    it('returns 500 when getItemsByShelfId fails', async () => {
      const shelf = createMockShelf();
      vi.mocked(getShelfsByUserId).mockResolvedValue([shelf]);
      vi.mocked(getItemsByShelfId).mockRejectedValue(new Error('Database error'));

      const req = new Request('http://localhost:3000/api/shelf/dashboard');

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch dashboard');
    });
  });
});
