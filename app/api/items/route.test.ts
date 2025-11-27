/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// Mock dependencies
vi.mock('@/lib/utils/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  getShelfById: vi.fn(),
  createItem: vi.fn(),
  getNextOrderIndex: vi.fn(),
}));

import { getSession } from '@/lib/utils/session';
import { getShelfById, createItem, getNextOrderIndex } from '@/lib/db/queries';

// Helper to create a mock request
function createRequest(body: object): Request {
  return new Request('http://localhost:3000/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/items', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getShelfById).mockReset();
    vi.mocked(createItem).mockReset();
    vi.mocked(getNextOrderIndex).mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const req = createRequest({
        shelf_id: 'shelf-1',
        type: 'book',
        title: 'Test Book',
        creator: 'Author',
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
        type: 'book',
        title: 'Test',
        creator: 'Author',
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
        type: 'book',
        title: 'Test',
        creator: 'Author',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Shelf ID is required');
    });

    it('returns 400 for invalid item type', async () => {
      vi.mocked(getShelfById).mockResolvedValue({
        id: 'shelf-1',
        user_id: 'user-1',
        name: 'Test',
      } as any);

      const req = createRequest({
        shelf_id: 'shelf-1',
        type: 'movie', // Invalid type
        title: 'Test',
        creator: 'Author',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Type must be one of');
    });

    it('returns 400 for empty title', async () => {
      vi.mocked(getShelfById).mockResolvedValue({
        id: 'shelf-1',
        user_id: 'user-1',
        name: 'Test',
      } as any);

      const req = createRequest({
        shelf_id: 'shelf-1',
        type: 'book',
        title: '',
        creator: 'Author',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Title');
    });

    it('returns 400 for empty creator', async () => {
      vi.mocked(getShelfById).mockResolvedValue({
        id: 'shelf-1',
        user_id: 'user-1',
        name: 'Test',
      } as any);

      const req = createRequest({
        shelf_id: 'shelf-1',
        type: 'book',
        title: 'Test Book',
        creator: '',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Creator');
    });

    it('returns 400 for invalid image URL', async () => {
      vi.mocked(getShelfById).mockResolvedValue({
        id: 'shelf-1',
        user_id: 'user-1',
        name: 'Test',
      } as any);

      const req = createRequest({
        shelf_id: 'shelf-1',
        type: 'book',
        title: 'Test',
        creator: 'Author',
        image_url: 'not-a-valid-url',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('URL');
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('returns 404 when shelf not found', async () => {
      vi.mocked(getShelfById).mockResolvedValue(null);

      const req = createRequest({
        shelf_id: 'nonexistent',
        type: 'book',
        title: 'Test',
        creator: 'Author',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Shelf not found');
    });

    it('returns 403 when user does not own the shelf', async () => {
      vi.mocked(getShelfById).mockResolvedValue({
        id: 'shelf-1',
        user_id: 'different-user', // Different owner
        name: 'Test',
      } as any);

      const req = createRequest({
        shelf_id: 'shelf-1',
        type: 'book',
        title: 'Test',
        creator: 'Author',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getShelfById).mockResolvedValue({
        id: 'shelf-1',
        user_id: 'user-1',
        name: 'My Shelf',
      } as any);
      vi.mocked(getNextOrderIndex).mockResolvedValue(0);
    });

    it('creates item with minimal fields', async () => {
      const mockItem = {
        id: 'item-1',
        shelf_id: 'shelf-1',
        type: 'book',
        title: 'The Great Gatsby',
        creator: 'F. Scott Fitzgerald',
        order_index: 0,
      };
      vi.mocked(createItem).mockResolvedValue(mockItem as any);

      const req = createRequest({
        shelf_id: 'shelf-1',
        type: 'book',
        title: 'The Great Gatsby',
        creator: 'F. Scott Fitzgerald',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('The Great Gatsby');
      expect(data.data.creator).toBe('F. Scott Fitzgerald');
    });

    it('creates item with all optional fields', async () => {
      const mockItem = {
        id: 'item-2',
        shelf_id: 'shelf-1',
        type: 'podcast',
        title: 'Tech Talk',
        creator: 'Host Name',
        image_url: 'https://example.com/image.jpg',
        external_url: 'https://podcast.example.com',
        notes: 'Great podcast!',
        order_index: 0,
      };
      vi.mocked(createItem).mockResolvedValue(mockItem as any);

      const req = createRequest({
        shelf_id: 'shelf-1',
        type: 'podcast',
        title: 'Tech Talk',
        creator: 'Host Name',
        image_url: 'https://example.com/image.jpg',
        external_url: 'https://podcast.example.com',
        notes: 'Great podcast!',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.image_url).toBe('https://example.com/image.jpg');
      expect(data.data.notes).toBe('Great podcast!');
    });

    it('assigns correct order index', async () => {
      vi.mocked(getNextOrderIndex).mockResolvedValue(5);
      vi.mocked(createItem).mockImplementation(async (shelfId, itemData) => ({
        id: 'item-new',
        shelf_id: shelfId,
        ...itemData,
      } as any));

      const req = createRequest({
        shelf_id: 'shelf-1',
        type: 'music',
        title: 'Album Name',
        creator: 'Artist',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(createItem).toHaveBeenCalledWith(
        'shelf-1',
        expect.objectContaining({ order_index: 5 }),
        'user-1'
      );
    });

    it('accepts all valid item types', async () => {
      vi.mocked(createItem).mockImplementation(async (shelfId, itemData) => ({
        id: 'item-new',
        shelf_id: shelfId,
        ...itemData,
      } as any));

      for (const type of ['book', 'podcast', 'music']) {
        const req = createRequest({
          shelf_id: 'shelf-1',
          type,
          title: `Test ${type}`,
          creator: 'Creator',
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
      }
    });
  });
});
