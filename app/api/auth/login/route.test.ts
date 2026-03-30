/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { createMockRequest, createMockUser } from '@/test/utils/mocks';

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

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.mocked(getUserByUsername).mockReset();
    vi.mocked(verifyPassword).mockReset();
    vi.mocked(setSessionCookie).mockReset();
  });

  describe('Validation', () => {
    it('returns 400 for empty username', async () => {
      const req = createMockRequest('POST', { username: '', password: 'password123' }, 'http://localhost:3000/api/auth/login');

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_FAILED');
      expect(data.error.message).toContain('Invalid username');
    });

    it('returns 400 for short username', async () => {
      const req = createMockRequest('POST', { username: 'ab', password: 'password123' }, 'http://localhost:3000/api/auth/login');

      const res = await POST(req);
      await res.json();

      expect(res.status).toBe(400);
    });

    it('returns 400 for empty password', async () => {
      const req = createMockRequest('POST', { username: 'testuser', password: '' }, 'http://localhost:3000/api/auth/login');

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_FAILED');
      expect(data.error.message).toContain('Invalid password');
    });

    it('returns 400 for short password', async () => {
      const req = createMockRequest('POST', { username: 'testuser', password: '12345' }, 'http://localhost:3000/api/auth/login');

      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe('Authentication', () => {
    it('returns 401 when user not found', async () => {
      vi.mocked(getUserByUsername).mockResolvedValue(null);

      const req = createMockRequest('POST', { username: 'nonexistent', password: 'password123' }, 'http://localhost:3000/api/auth/login');

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
      expect(data.error.message).toBe('Invalid username or password');
    });

    it('returns 401 for Google-only account', async () => {
      vi.mocked(getUserByUsername).mockResolvedValue(
        createMockUser({
          username: 'testuser',
          password_hash: null,
          google_id: 'google-123',
        })
      );

      const req = createMockRequest('POST', { username: 'testuser', password: 'password123' }, 'http://localhost:3000/api/auth/login');

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
      expect(data.error.message).toContain('Google authentication');
    });

    it('returns 401 for incorrect password', async () => {
      vi.mocked(getUserByUsername).mockResolvedValue(
        createMockUser({
          username: 'testuser',
          password_hash: 'hashed_password',
        })
      );
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const req = createMockRequest('POST', { username: 'testuser', password: 'wrongpassword' }, 'http://localhost:3000/api/auth/login');

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
      expect(data.error.message).toBe('Invalid username or password');
    });
  });

  describe('Success', () => {
    it('logs in user with correct credentials', async () => {
      const mockUser = createMockUser({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
      });
      vi.mocked(getUserByUsername).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(setSessionCookie).mockResolvedValue(undefined);

      const req = createMockRequest('POST', { username: 'testuser', password: 'password123' }, 'http://localhost:3000/api/auth/login');

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.username).toBe('testuser');
    });

    it('normalizes username to lowercase', async () => {
      const mockUser = createMockUser({
        username: 'testuser',
      });
      vi.mocked(getUserByUsername).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);

      const req = createMockRequest('POST', { username: 'TestUser', password: 'password123' }, 'http://localhost:3000/api/auth/login');

      await POST(req);

      expect(getUserByUsername).toHaveBeenCalledWith('testuser');
    });

    it('sets session cookie on successful login', async () => {
      const mockUser = createMockUser({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      });
      vi.mocked(getUserByUsername).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);

      const req = createMockRequest('POST', { username: 'testuser', password: 'password123' }, 'http://localhost:3000/api/auth/login');

      await POST(req);

      expect(setSessionCookie).toHaveBeenCalledWith({
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      });
    });
  });
});
