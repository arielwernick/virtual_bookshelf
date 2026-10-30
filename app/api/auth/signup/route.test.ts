/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { createRequest, createMockUser } from '@/test/utils/mocks';
import { cookies } from 'next/headers';

// Mock dependencies
vi.mock('@/lib/db/queries', () => ({
  getUserByUsername: vi.fn(),
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock('@/lib/utils/password', () => ({
  hashPassword: vi.fn(),
}));

vi.mock('@/lib/utils/session', () => ({
  setSessionCookie: vi.fn(),
}));

import { getUserByUsername, getUserByEmail, createUser } from '@/lib/db/queries';
import { hashPassword } from '@/lib/utils/password';
import { setSessionCookie } from '@/lib/utils/session';

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.mocked(getUserByUsername).mockReset();
    vi.mocked(getUserByEmail).mockReset();
    vi.mocked(createUser).mockReset();
    vi.mocked(hashPassword).mockReset();
    vi.mocked(setSessionCookie).mockReset();
  });

  describe('Validation', () => {
    it('returns 400 for empty username', async () => {
      const req = createRequest({
        username: '',
        email: 'test@example.com',
        password: 'password123',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 400 for invalid username characters', async () => {
      const req = createRequest({
        username: 'test@user',
        email: 'test@example.com',
        password: 'password123',
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 400 for short username', async () => {
      const req = createRequest({
        username: 'ab',
        email: 'test@example.com',
        password: 'password123',
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid email', async () => {
      const req = createRequest({
        username: 'testuser',
        email: 'not-an-email',
        password: 'password123',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('email');
    });

    it('returns 400 for empty email', async () => {
      const req = createRequest({
        username: 'testuser',
        email: '',
        password: 'password123',
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 400 for short password', async () => {
      const req = createRequest({
        username: 'testuser',
        email: 'test@example.com',
        password: '12345',
      });

      const res = await POST(req);
      await res.json();

      expect(res.status).toBe(400);
    });

    it('returns 400 for empty password', async () => {
      const req = createRequest({
        username: 'testuser',
        email: 'test@example.com',
        password: '',
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe('Duplicate Check', () => {
    it('returns 409 when username already exists', async () => {
      vi.mocked(getUserByUsername).mockResolvedValue(createMockUser({
        id: 'existing-user',
        username: 'testuser',
        email: 'existing@example.com',
        password_hash: 'hash',
        google_id: null,
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      const req = createRequest({
        username: 'testuser',
        email: 'new@example.com',
        password: 'password123',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.error).toBe('Username already taken');
    });

    it('returns 409 when email already exists', async () => {
      vi.mocked(getUserByUsername).mockResolvedValue(null);
      vi.mocked(getUserByEmail).mockResolvedValue(createMockUser({
        id: 'existing-user',
        username: 'existinguser',
        email: 'test@example.com',
        password_hash: 'hash',
        google_id: null,
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      const req = createRequest({
        username: 'newuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.error).toBe('Email already registered');
    });
  });

  describe('Success', () => {
    beforeEach(() => {
      vi.mocked(getUserByUsername).mockResolvedValue(null);
      vi.mocked(getUserByEmail).mockResolvedValue(null);
      vi.mocked(hashPassword).mockResolvedValue('hashed_password');
    });

    it('creates new user successfully', async () => {
      const mockUser = createMockUser({
        id: 'new-user-1',
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed_password',
        google_id: null,
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      vi.mocked(createUser).mockResolvedValue(mockUser);

      const req = createRequest({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.username).toBe('newuser');
      expect(data.data.email).toBe('new@example.com');
    });

    it('records email signup source and attribution cookie', async () => {
      const attribution = encodeURIComponent(
        JSON.stringify({ r: 'https://www.google.com/', us: 'newsletter' })
      );
      vi.mocked(cookies).mockResolvedValueOnce({
        get: vi.fn((name: string) => (name === 'vb_attribution' ? { value: attribution } : undefined)),
      } as unknown as Awaited<ReturnType<typeof cookies>>);
      vi.mocked(createUser).mockResolvedValue(createMockUser({ username: 'newuser' }));

      const res = await POST(createRequest({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      }));

      expect(res.status).toBe(200);
      expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
        signupSource: 'email',
        attribution: {
          firstReferrer: 'https://www.google.com',
          utmSource: 'newsletter',
          utmMedium: null,
          utmCampaign: null,
        },
      }));
    });

    it('creates user without attribution when no cookie is present', async () => {
      vi.mocked(createUser).mockResolvedValue(createMockUser({ username: 'newuser' }));

      const res = await POST(createRequest({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      }));

      expect(res.status).toBe(200);
      expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
        signupSource: 'email',
        attribution: null,
      }));
    });

    it('normalizes username and email', async () => {
      const mockUser = createMockUser({
        id: 'new-user-1',
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed_password',
        google_id: null,
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      vi.mocked(createUser).mockResolvedValue(mockUser);

      const req = createRequest({
        username: 'NewUser',
        email: 'New@Example.COM',
        password: 'password123',
      });

      await POST(req);

      expect(createUser).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        passwordHash: 'hashed_password',
        signupSource: 'email',
        attribution: null,
      });
    });

    it('hashes password before storing', async () => {
      const mockUser = createMockUser({
        id: 'new-user-1',
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed_password',
        google_id: null,
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      vi.mocked(createUser).mockResolvedValue(mockUser);

      const req = createRequest({
        username: 'newuser',
        email: 'new@example.com',
        password: 'mypassword',
      });

      await POST(req);

      expect(hashPassword).toHaveBeenCalledWith('mypassword');
      expect(createUser).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: 'hashed_password' })
      );
    });

    it('sets session cookie after signup', async () => {
      const mockUser = createMockUser({
        id: 'new-user-1',
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed_password',
        google_id: null,
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      vi.mocked(createUser).mockResolvedValue(mockUser);

      const req = createRequest({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });

      await POST(req);

      expect(setSessionCookie).toHaveBeenCalledWith({
        userId: 'new-user-1',
        username: 'newuser',
        email: 'new@example.com',
      });
    });

    it('returns user data without password', async () => {
      const mockUser = createMockUser({
        id: 'new-user-1',
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed_password',
        google_id: null,
        share_token: 'token',
        description: null,
        title: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      vi.mocked(createUser).mockResolvedValue(mockUser);

      const req = createRequest({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(data.data).not.toHaveProperty('password');
      expect(data.data).not.toHaveProperty('password_hash');
    });
  });
});
