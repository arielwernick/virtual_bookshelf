/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { Shelf, ShelfType } from '@/lib/types/shelf';

// Mock dependencies
vi.mock('@/lib/utils/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  createShelf: vi.fn(),
}));

import { getSession } from '@/lib/utils/session';
import { createShelf } from '@/lib/db/queries';

// Helper to create request
function createRequest(body: object): Request {
  return new Request('http://localhost:3000/api/shelf/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Helper to create mock shelf
function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'My Shelf',
    description: null,
    share_token: 'abc123',
    is_public: false,
    shelf_type: 'standard' as ShelfType,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('POST /api/shelf/create', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(createShelf).mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const req = createRequest({ name: 'Test Shelf' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('returns 401 when session has no userId', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: '', username: 'test' });

      const req = createRequest({ name: 'Test Shelf' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('returns 400 when name is missing', async () => {
      const req = createRequest({});

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Shelf name is required');
    });

    it('returns 400 when name is empty string', async () => {
      const req = createRequest({ name: '' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Shelf name is required');
    });

    it('returns 400 when name is only whitespace', async () => {
      const req = createRequest({ name: '   ' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Shelf name is required');
    });

    it('returns 400 when name is not a string', async () => {
      const req = createRequest({ name: 123 });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Shelf name is required');
    });

    it('returns 400 when name exceeds 100 characters', async () => {
      const req = createRequest({ name: 'a'.repeat(101) });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('100 characters or less');
    });

    it('returns 400 when description is not a string', async () => {
      const req = createRequest({ name: 'Test Shelf', description: 123 });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Description must be a string');
    });

    it('returns 400 when description exceeds 1000 characters', async () => {
      const req = createRequest({ 
        name: 'Test Shelf', 
        description: 'a'.repeat(1001) 
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('1000 characters or less');
    });

    it('returns 400 for invalid shelf_type', async () => {
      const req = createRequest({ 
        name: 'Test Shelf', 
        shelf_type: 'invalid' 
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('creates shelf with minimal fields', async () => {
      const mockShelf = createMockShelf({ name: 'My Books' });
      vi.mocked(createShelf).mockResolvedValue(mockShelf);

      const req = createRequest({ name: 'My Books' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('My Books');
      expect(data.data.id).toBe('shelf-1');
      expect(data.data.share_token).toBe('abc123');
      expect(createShelf).toHaveBeenCalledWith('user-1', 'My Books', null, 'standard');
    });

    it('creates shelf with description', async () => {
      const mockShelf = createMockShelf({ 
        name: 'My Books', 
        description: 'Favorite books' 
      });
      vi.mocked(createShelf).mockResolvedValue(mockShelf);

      const req = createRequest({ 
        name: 'My Books', 
        description: 'Favorite books' 
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(createShelf).toHaveBeenCalledWith('user-1', 'My Books', 'Favorite books', 'standard');
    });

    it('creates shelf with top5 type', async () => {
      const mockShelf = createMockShelf({ 
        name: 'Top 5 Books',
        shelf_type: 'top5' as ShelfType
      });
      vi.mocked(createShelf).mockResolvedValue(mockShelf);

      const req = createRequest({ 
        name: 'Top 5 Books',
        shelf_type: 'top5'
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.shelf_type).toBe('top5');
      expect(createShelf).toHaveBeenCalledWith('user-1', 'Top 5 Books', null, 'top5');
    });

    it('trims whitespace from name and description', async () => {
      const mockShelf = createMockShelf({ 
        name: 'My Books',
        description: 'Test description'
      });
      vi.mocked(createShelf).mockResolvedValue(mockShelf);

      const req = createRequest({ 
        name: '  My Books  ', 
        description: '  Test description  '
      });

      await POST(req);

      expect(createShelf).toHaveBeenCalledWith('user-1', 'My Books', 'Test description', 'standard');
    });

    it('accepts empty description as null', async () => {
      const mockShelf = createMockShelf({ name: 'My Books' });
      vi.mocked(createShelf).mockResolvedValue(mockShelf);

      const req = createRequest({ 
        name: 'My Books', 
        description: '   ' 
      });

      await POST(req);

      expect(createShelf).toHaveBeenCalledWith('user-1', 'My Books', null, 'standard');
    });

    it('returns created_at in response', async () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const mockShelf = createMockShelf({ created_at: createdAt });
      vi.mocked(createShelf).mockResolvedValue(mockShelf);

      const req = createRequest({ name: 'Test Shelf' });

      const res = await POST(req);
      const data = await res.json();

      expect(data.data.created_at).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('returns 500 when database operation fails', async () => {
      vi.mocked(createShelf).mockRejectedValue(new Error('Database error'));

      const req = createRequest({ name: 'Test Shelf' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create shelf');
    });
  });
});
