/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  getUserById: vi.fn(),
}));

import { getSession } from './session';
import { getUserById } from '@/lib/db/queries';
import { getAdminEmails, isAdminEmail, getAdminUser } from './admin';
import { createMockUser } from '@/test/utils/mocks';

describe('admin access', () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    process.env.ADMIN_EMAILS = ' Owner@Example.com, second@example.com ,';
    vi.mocked(getSession).mockReset();
    vi.mocked(getUserById).mockReset();
  });

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  });

  describe('getAdminEmails', () => {
    it('parses, trims, and lowercases the list', () => {
      expect(getAdminEmails()).toEqual(['owner@example.com', 'second@example.com']);
    });

    it('returns an empty list when unset', () => {
      delete process.env.ADMIN_EMAILS;
      expect(getAdminEmails()).toEqual([]);
    });
  });

  describe('isAdminEmail', () => {
    it('matches case-insensitively', () => {
      expect(isAdminEmail('OWNER@example.com')).toBe(true);
    });

    it('rejects other and empty emails', () => {
      expect(isAdminEmail('someone@example.com')).toBe(false);
      expect(isAdminEmail(null)).toBe(false);
      expect(isAdminEmail('')).toBe(false);
    });

    it('denies everyone when ADMIN_EMAILS is unset', () => {
      delete process.env.ADMIN_EMAILS;
      expect(isAdminEmail('owner@example.com')).toBe(false);
    });
  });

  describe('getAdminUser', () => {
    it('returns null without a session', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      expect(await getAdminUser()).toBeNull();
      expect(getUserById).not.toHaveBeenCalled();
    });

    it('returns null for a non-admin user', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', username: 'someone' });
      vi.mocked(getUserById).mockResolvedValue(createMockUser({ email: 'someone@example.com' }));

      expect(await getAdminUser()).toBeNull();
    });

    it('checks the database email, not the session email', async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: 'user-1',
        username: 'someone',
        email: 'owner@example.com',
      });
      vi.mocked(getUserById).mockResolvedValue(createMockUser({ email: 'someone@example.com' }));

      expect(await getAdminUser()).toBeNull();
    });

    it('returns the user when their email is an admin email', async () => {
      const owner = createMockUser({ email: 'owner@example.com' });
      vi.mocked(getSession).mockResolvedValue({ userId: owner.id, username: owner.username });
      vi.mocked(getUserById).mockResolvedValue(owner);

      expect(await getAdminUser()).toEqual(owner);
    });

    it('returns null when the session user no longer exists', async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: 'deleted', username: null });
      vi.mocked(getUserById).mockResolvedValue(null);

      expect(await getAdminUser()).toBeNull();
    });
  });
});
