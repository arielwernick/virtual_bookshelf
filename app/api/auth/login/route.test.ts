/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// Mock dependencies
vi.mock('@/lib/db/queries', () => ({
  getUserByUsername: vi.fn(),
}));

vi.mock('@/lib/utils/password', () => ({
  verifyPassword: vi.fn(),
}));

vi.mock('@/lib/utils/session', () => ({
  setSessionCookie: vi.fn(),
}));

import { getUserByUsername } from '@/lib/db/queries';
import { verifyPassword } from '@/lib/utils/password';
import { setSessionCookie } from '@/lib/utils/session';

// Helper to create request
function createRequest(body: object): Request {
  return new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.mocked(getUserByUsername).mockReset();
    vi.mocked(verifyPassword).mockReset();
    vi.mocked(setSessionCookie).mockReset();
  });

  describe('Validation', () => {
    it('returns 400 for empty username', async () => {
      const req = createRequest({ username: '', password: 'password123' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid username');
    });

    it('returns 400 for short username', async () => {
      const req = createRequest({ username: 'ab', password: 'password123' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
    });

    it('returns 400 for empty password', async () => {
      const req = createRequest({ username: 'testuser', password: '' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid password');
    });

    it('returns 400 for short password', async () => {
      const req = createRequest({ username: 'testuser', password: '12345' });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe('Authentication', () => {
    it('returns 401 when user not found', async () => {
      vi.mocked(getUserByUsername).mockResolvedValue(null);

      const req = createRequest({ username: 'nonexistent', password: 'password123' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Invalid username or password');
    });

    it('returns 401 for Google-only account', async () => {
      vi.mocked(getUserByUsername).mockResolvedValue({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: null, // No password - Google auth only
        google_id: 'google-123',
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const req = createRequest({ username: 'testuser', password: 'password123' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain('Google authentication');
    });

    it('returns 401 for incorrect password', async () => {
      vi.mocked(getUserByUsername).mockResolvedValue({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        google_id: null,
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const req = createRequest({ username: 'testuser', password: 'wrongpassword' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Invalid username or password');
    });
  });

  describe('Success', () => {
    it('logs in user with correct credentials', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        google_id: null,
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      vi.mocked(getUserByUsername).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(setSessionCookie).mockResolvedValue(undefined);

      const req = createRequest({ username: 'testuser', password: 'password123' });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.username).toBe('testuser');
    });

    it('normalizes username to lowercase', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        google_id: null,
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      vi.mocked(getUserByUsername).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);

      const req = createRequest({ username: 'TestUser', password: 'password123' });

      await POST(req);

      expect(getUserByUsername).toHaveBeenCalledWith('testuser');
    });

    it('sets session cookie on successful login', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        google_id: null,
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      vi.mocked(getUserByUsername).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);

      const req = createRequest({ username: 'testuser', password: 'password123' });

      await POST(req);

      expect(setSessionCookie).toHaveBeenCalledWith({
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      });
    });
  });
});
