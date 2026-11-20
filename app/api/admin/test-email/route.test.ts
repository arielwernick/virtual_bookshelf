// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils/admin', () => ({ getAdminUser: vi.fn() }));
vi.mock('@/lib/email/send', () => ({ sendEmail: vi.fn() }));

import { POST } from './route';
import { getAdminUser } from '@/lib/utils/admin';
import { sendEmail } from '@/lib/email/send';
import type { User } from '@/lib/types/shelf';

const createMockUser = (overrides: Partial<User> = {}): User =>
  ({ id: 'admin-1', email: 'admin@example.com', username: 'admin', ...overrides }) as User;

describe('POST /api/admin/test-email', () => {
  beforeEach(() => {
    vi.mocked(getAdminUser).mockReset();
    vi.mocked(sendEmail).mockReset();
  });

  it('returns 404 to anyone who is not an admin', async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(404);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends only to the admin's own address and reports the result", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(createMockUser());
    vi.mocked(sendEmail).mockResolvedValue({ sent: true, id: 'email-1' });

    const res = await POST();
    const json = await res.json();

    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@example.com' }));
    expect(json).toEqual({ success: true, data: { sent: true, id: 'email-1' } });
  });

  it('says why nothing was sent', async () => {
    vi.mocked(getAdminUser).mockResolvedValue(createMockUser());
    vi.mocked(sendEmail).mockResolvedValue({ sent: false, reason: 'not_allowlisted' });

    const json = await (await POST()).json();
    expect(json).toEqual({ success: false, data: { sent: false, reason: 'not_allowlisted' } });
  });
});
