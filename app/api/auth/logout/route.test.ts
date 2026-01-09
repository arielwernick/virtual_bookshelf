/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// Mock dependencies
vi.mock('@/lib/utils/session', () => ({
  clearSession: vi.fn(),
}));

import { clearSession } from '@/lib/utils/session';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.mocked(clearSession).mockReset();
  });

  describe('Success', () => {
    it('clears session and returns success', async () => {
      vi.mocked(clearSession).mockResolvedValue(undefined);

      const res = await POST();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logged out successfully');
      expect(clearSession).toHaveBeenCalledOnce();
    });
  });

  describe('Error Handling', () => {
    it('returns 500 when clearSession fails', async () => {
      vi.mocked(clearSession).mockRejectedValue(new Error('Session clear failed'));

      const res = await POST();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Logout failed');
    });
  });
});
