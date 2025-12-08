/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from './route';
import { Shelf, ShelfType } from '@/lib/types/shelf';

// Mock dependencies
vi.mock('@/lib/utils/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  getShelfById: vi.fn(),
  getItemsByShelfId: vi.fn(),
  updateShelf: vi.fn(),
  deleteShelf: vi.fn(),
}));

import { getSession } from '@/lib/utils/session';
import { getShelfById, getItemsByShelfId, updateShelf, deleteShelf } from '@/lib/db/queries';

// Helper to create a mock request
function createRequest(method: string, body?: object): Request {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return new Request('http://localhost:3000/api/shelf/shelf-1', options);
}

// Helper to create mock params
function createParams(shelfId: string = 'shelf-1') {
  return { params: Promise.resolve({ shelfId }) };
}

// Helper to create a mock shelf
function createMockShelf(overrides: Partial<Shelf> = {}): Shelf {
  return {
    id: 'shelf-1',
    user_id: 'user-1',
    name: 'Test Shelf',
    description: null,
    share_token: 'test-token',
    is_public: false,
    shelf_type: 'standard' as ShelfType,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('PATCH /api/shelf/[shelfId]', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getShelfById).mockReset();
    vi.mocked(updateShelf).mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const req = createRequest('PATCH', { name: 'New Name' });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not authenticated');
    });

    it('returns 401 when session has no userId', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: '', username: 'test' });

      const req = createRequest('PATCH', { name: 'New Name' });
      const res = await PATCH(req, createParams());

      expect(res.status).toBe(401);
    });
  });

  describe('Authorization - Ownership Validation', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
    });

    it('returns 404 when shelf not found', async () => {
      vi.mocked(getShelfById).mockResolvedValue(null);

      const req = createRequest('PATCH', { name: 'New Name' });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Shelf not found');
    });

    it('returns 403 when user does not own the shelf', async () => {
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ user_id: 'different-user' }));

      const req = createRequest('PATCH', { name: 'New Name' });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
    });

    it('prevents non-owner from changing is_public to false (unpublishing)', async () => {
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ 
        user_id: 'owner-user',
        is_public: true 
      }));
      vi.mocked(getSession).mockResolvedValue({ userId: 'attacker-user', username: 'attacker' });

      const req = createRequest('PATCH', { is_public: false });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
      expect(updateShelf).not.toHaveBeenCalled();
    });

    it('prevents non-owner from changing is_public to true (publishing)', async () => {
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ 
        user_id: 'owner-user',
        is_public: false 
      }));
      vi.mocked(getSession).mockResolvedValue({ userId: 'attacker-user', username: 'attacker' });

      const req = createRequest('PATCH', { is_public: true });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
      expect(updateShelf).not.toHaveBeenCalled();
    });

    it('prevents non-owner from changing shelf name', async () => {
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ user_id: 'owner-user' }));
      vi.mocked(getSession).mockResolvedValue({ userId: 'attacker-user', username: 'attacker' });

      const req = createRequest('PATCH', { name: 'Malicious Name' });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
      expect(updateShelf).not.toHaveBeenCalled();
    });

    it('prevents non-owner from changing shelf description', async () => {
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ user_id: 'owner-user' }));
      vi.mocked(getSession).mockResolvedValue({ userId: 'attacker-user', username: 'attacker' });

      const req = createRequest('PATCH', { description: 'Spam description' });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
      expect(updateShelf).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
    });

    it('returns 400 for empty name', async () => {
      const req = createRequest('PATCH', { name: '' });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('name');
    });

    it('returns 400 for name too long', async () => {
      const req = createRequest('PATCH', { name: 'a'.repeat(101) });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('100 characters');
    });

    it('returns 400 for invalid is_public type', async () => {
      const req = createRequest('PATCH', { is_public: 'yes' });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('boolean');
    });

    it('returns 400 when no fields provided', async () => {
      const req = createRequest('PATCH', {});
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('No fields to update');
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
    });

    it('allows owner to publish shelf (set is_public to true)', async () => {
      const updatedShelf = createMockShelf({ is_public: true });
      vi.mocked(updateShelf).mockResolvedValue(updatedShelf);

      const req = createRequest('PATCH', { is_public: true });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.is_public).toBe(true);
      expect(updateShelf).toHaveBeenCalledWith('shelf-1', { is_public: true });
    });

    it('allows owner to unpublish shelf (set is_public to false)', async () => {
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ is_public: true }));
      const updatedShelf = createMockShelf({ is_public: false });
      vi.mocked(updateShelf).mockResolvedValue(updatedShelf);

      const req = createRequest('PATCH', { is_public: false });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.is_public).toBe(false);
      expect(updateShelf).toHaveBeenCalledWith('shelf-1', { is_public: false });
    });

    it('allows owner to update shelf name', async () => {
      const updatedShelf = createMockShelf({ name: 'Updated Name' });
      vi.mocked(updateShelf).mockResolvedValue(updatedShelf);

      const req = createRequest('PATCH', { name: 'Updated Name' });
      const res = await PATCH(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated Name');
    });
  });
});

describe('DELETE /api/shelf/[shelfId]', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getShelfById).mockReset();
    vi.mocked(deleteShelf).mockReset();
  });

  describe('Authorization - Ownership Validation', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const req = createRequest('DELETE');
      const res = await DELETE(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('returns 403 when user does not own the shelf', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ user_id: 'different-user' }));

      const req = createRequest('DELETE');
      const res = await DELETE(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
      expect(deleteShelf).not.toHaveBeenCalled();
    });

    it('allows owner to delete their own shelf', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
      vi.mocked(deleteShelf).mockResolvedValue();

      const req = createRequest('DELETE');
      const res = await DELETE(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(deleteShelf).toHaveBeenCalledWith('shelf-1');
    });
  });
});

describe('GET /api/shelf/[shelfId]', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(getShelfById).mockReset();
    vi.mocked(getItemsByShelfId).mockReset();
  });

  describe('Authorization - Read Access', () => {
    it('allows owner to read their own shelf', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'testuser' });
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf());
      vi.mocked(getItemsByShelfId).mockResolvedValue([]);

      const req = createRequest('GET');
      const res = await GET(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('allows anyone to read public shelf', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'different-user', username: 'other' });
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ 
        user_id: 'owner-user',
        is_public: true 
      }));
      vi.mocked(getItemsByShelfId).mockResolvedValue([]);

      const req = createRequest('GET');
      const res = await GET(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('prevents non-owner from reading private shelf', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'different-user', username: 'other' });
      vi.mocked(getShelfById).mockResolvedValue(createMockShelf({ 
        user_id: 'owner-user',
        is_public: false 
      }));

      const req = createRequest('GET');
      const res = await GET(req, createParams());
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
